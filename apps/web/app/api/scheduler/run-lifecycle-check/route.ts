import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processRequest, createSecretaryStateService } from '@smart-todos/agent';
import {
  analyzeTask,
  shouldNotifyUser,
} from '@/lib/scheduler/intervention-logic';
import {
  Intervention,
  SchedulerResult,
  TaskAnalysis,
} from '@/lib/scheduler/types';
import { createInterventionEvaluator } from '@/lib/scheduler/intervention-evaluator';

// Configure timeout for Vercel (300 seconds = 5 minutes with Fluid Compute)
export const maxDuration = 300;

// Scheduler configuration
const SCHEDULER_CONFIG = {
  enabled: process.env.SCHEDULER_ENABLED === 'true' || true,
  batchSize: parseInt(process.env.SCHEDULER_BATCH_SIZE || '50'),
  maxInterventionsPerUser: parseInt(
    process.env.SCHEDULER_MAX_INTERVENTIONS_PER_USER || '5'
  ),
  minHoursBetweenInterventions: parseInt(
    process.env.SCHEDULER_MIN_HOURS_BETWEEN_INTERVENTIONS || '2'
  ),
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Verify authorization
  const authHeader = req.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.SCHEDULER_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check if scheduler is enabled
  if (!SCHEDULER_CONFIG.enabled) {
    return NextResponse.json(
      { error: 'Scheduler is disabled' },
      { status: 503 }
    );
  }

  const result: SchedulerResult = {
    tasksProcessed: 0,
    interventionsCreated: 0,
    notificationsSent: 0,
    errors: [],
    duration: 0,
    timestamp: new Date(),
  };

  try {
    console.log('[Scheduler] Starting task lifecycle check...');

    // 3. Identify tasks needing attention
    const tasksNeedingAttention = await identifyTasksNeedingAttention();
    console.log(
      `[Scheduler] Found ${tasksNeedingAttention.length} tasks needing attention`
    );

    result.tasksProcessed = tasksNeedingAttention.length;

    // 4. Process each intervention
    for (const taskAnalysis of tasksNeedingAttention) {
      try {
        if (taskAnalysis.needsIntervention && taskAnalysis.intervention) {
          await processIntervention(taskAnalysis.intervention);
          result.interventionsCreated++;
          result.notificationsSent++;
        }
      } catch (error) {
        const errorMsg = `Failed to process task ${taskAnalysis.taskId}: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    result.duration = Date.now() - startTime;

    console.log(
      `[Scheduler] Completed. Processed ${result.tasksProcessed} tasks, created ${result.interventionsCreated} interventions in ${result.duration}ms`
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorMsg = `Scheduler run failed: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
    result.duration = Date.now() - startTime;

    return NextResponse.json(result, { status: 500 });
  }
}

/**
 * Identify all tasks that need intervention
 */
async function identifyTasksNeedingAttention(): Promise<TaskAnalysis[]> {
  // Get active users (who have logged in recently)
  const activeUsers = await getActiveUsers();
  console.log(`[Scheduler] Found ${activeUsers.length} active users`);

  const tasksNeedingAttention: TaskAnalysis[] = [];

  for (const user of activeUsers) {
    // Check if user has reached max interventions today
    const interventionCount = await getInterventionCountToday(user.id);
    if (interventionCount >= SCHEDULER_CONFIG.maxInterventionsPerUser) {
      console.log(
        `[Scheduler] User ${user.id} has reached max interventions for today`
      );
      continue;
    }

    // Get user's incomplete tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: false,
      },
    });

    console.log(
      `[Scheduler] User ${user.id} has ${tasks.length} incomplete tasks`
    );

    // Load contexts for this user
    const historicalContext = await loadHistoricalContext(user.id);
    const physicalContext = await loadPhysicalContext(user.id);

    console.log(
      `[Scheduler] User ${user.id} context: ${physicalContext ? `${physicalContext.currentActivity} at ${physicalContext.locationType}` : 'no physical context'}`
    );

    // Analyze each task with context-aware evaluation
    const evaluator = createInterventionEvaluator(prisma);

    for (const task of tasks) {
      // First, use traditional analysis to identify candidates
      const analysis = analyzeTask({
        ...task,
        user: user,
      });

      if (analysis.needsIntervention && analysis.intervention) {
        // Check if we recently sent an intervention for this task
        const recentIntervention = await hasRecentIntervention(
          task.id,
          SCHEDULER_CONFIG.minHoursBetweenInterventions
        );

        if (!recentIntervention) {
          // Now use context-aware evaluation to make final decision
          const evaluation = await evaluator.evaluateIntervention(
            user,
            task,
            historicalContext,
            physicalContext
          );

          if (evaluation.shouldIntervene && evaluation.optimalTiming === 'now') {
            // Update intervention priority and type based on context
            analysis.intervention.priority = evaluation.suggestedPriority;
            analysis.intervention.type = evaluation.suggestedInterventionType as any;
            analysis.reason = evaluation.reason;

            tasksNeedingAttention.push(analysis);

            console.log(
              `[Scheduler] Task ${task.id} approved with context-aware evaluation (interruptibility: ${evaluation.interruptibilityScore})`
            );
          } else {
            console.log(
              `[Scheduler] Task ${task.id} blocked by context-aware evaluation: ${evaluation.reason}`
            );
          }
        } else {
          console.log(
            `[Scheduler] Task ${task.id} has recent intervention, skipping`
          );
        }
      }
    }
  }

  // Sort by priority (highest first) and limit to batch size
  return tasksNeedingAttention
    .filter((t) => t.intervention)
    .sort(
      (a, b) => (b.intervention?.priority || 0) - (a.intervention?.priority || 0)
    )
    .slice(0, SCHEDULER_CONFIG.batchSize);
}

/**
 * Get active users (logged in within last 7 days)
 */
async function getActiveUsers() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get users who have logs in the last 7 days
  const activeLogs = await prisma.log.findMany({
    where: {
      type: {
        in: ['app_opened', 'user_login', 'task_created', 'task_updated'],
      },
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      userId: true,
    },
    distinct: ['userId'],
  });

  const activeUserIds = activeLogs
    .map((log) => log.userId)
    .filter((id): id is string => !!id);

  // Fetch full user objects with relations
  return await prisma.user.findMany({
    where: {
      id: {
        in: activeUserIds,
      },
    },
    include: {
      psychProfile: {
        include: {
          coach: true,
        },
      },
      settings: true,
    },
  });
}

/**
 * Get count of interventions sent to user today
 */
async function getInterventionCountToday(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.chatMessage.count({
    where: {
      userId,
      role: 'assistant',
      createdAt: {
        gte: startOfDay,
      },
      metadata: {
        path: ['interventionType'],
        not: {
          equals: null,
        },
      },
    },
  });

  return count;
}

/**
 * Check if task has received an intervention recently
 */
async function hasRecentIntervention(
  taskId: string,
  minHours: number
): Promise<boolean> {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - minHours);

  const recentMessage = await prisma.chatMessage.findFirst({
    where: {
      taskId,
      role: 'assistant',
      createdAt: {
        gte: cutoffTime,
      },
      metadata: {
        path: ['interventionType'],
        not: {
          equals: null,
        },
      },
    },
  });

  return !!recentMessage;
}

/**
 * Load historical context for user
 */
async function loadHistoricalContext(userId: string) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [notificationsToday, tasksToday, tasksWeek, streak, overdueCount, appOpenToday] = await Promise.all([
    // Notifications sent today
    prisma.chatMessage.count({
      where: {
        userId,
        role: 'assistant',
        createdAt: { gte: startOfToday },
      },
    }),
    // Tasks completed today
    prisma.task.count({
      where: {
        userId,
        completed: true,
        updatedAt: { gte: startOfToday },
      },
    }),
    // Tasks completed this week
    prisma.task.count({
      where: {
        userId,
        completed: true,
        updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Current streak
    prisma.streak.findFirst({
      where: {
        userId,
        type: 'daily',
      },
      orderBy: { count: 'desc' },
    }),
    // Overdue count
    prisma.task.count({
      where: {
        userId,
        completed: false,
        deadline: { lt: now },
      },
    }),
    // App opened today
    prisma.log.findFirst({
      where: {
        userId,
        type: 'app_opened',
        createdAt: { gte: startOfToday },
      },
    }),
  ]);

  const lastNotification = await prisma.chatMessage.findFirst({
    where: {
      userId,
      role: 'assistant',
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    notificationsSentToday: notificationsToday,
    lastNotificationSent: lastNotification?.createdAt || null,
    tasksCompletedToday: tasksToday,
    tasksCompletedThisWeek: tasksWeek,
    currentDailyStreak: streak?.count || 0,
    pomodorosCompletedToday: 0, // Simplified for now
    totalFocusMinutesToday: 0,
    averageMoodThisWeek: null,
    overdueTaskCount: overdueCount,
    appOpenedToday: !!appOpenToday,
  };
}

/**
 * Load physical context for user
 */
async function loadPhysicalContext(userId: string) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const latestContext = await prisma.userContext.findFirst({
    where: { userId },
    orderBy: { timestamp: 'desc' },
  });

  if (!latestContext || latestContext.timestamp < thirtyMinutesAgo) {
    return null; // Context is stale or unavailable
  }

  return {
    currentActivity: latestContext.activity as any,
    activityConfidence: latestContext.confidence,
    locationType: latestContext.locationType as any,
    isAtSavedLocation: !!latestContext.savedLocationId,
    savedLocationName: undefined, // Could fetch if needed
    screenOn: latestContext.screenOn,
    batteryLevel: latestContext.battery,
    doNotDisturb: latestContext.doNotDisturb,
    isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6,
    isWorkingHours: (() => {
      const hour = new Date().getHours();
      const day = new Date().getDay();
      return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
    })(),
  };
}

/**
 * Process a single intervention
 */
async function processIntervention(intervention: Intervention) {
  console.log(
    `[Scheduler] Processing intervention for task ${intervention.taskId} (type: ${intervention.type}, priority: ${intervention.priority})`
  );

  // Get user with relations
  const user = await prisma.user.findUnique({
    where: { id: intervention.userId },
    include: {
      psychProfile: {
        include: {
          coach: true,
        },
      },
      settings: true,
    },
  });

  if (!user) {
    throw new Error(`User ${intervention.userId} not found`);
  }

  // Check if user should receive this intervention
  if (!shouldNotifyUser(user, intervention)) {
    console.log(`[Scheduler] User preferences prevent sending intervention`);
    return;
  }

  // Invoke the agent to generate personalized message
  console.log(
    `[Scheduler] Invoking agent (${intervention.agentType}) for user ${intervention.userId}`
  );

  const agentResponse = await processRequest(
    intervention.userId,
    intervention.prompt,
    {
      taskId: intervention.taskId,
      databaseUrl: process.env.DATABASE_URL,
    }
  );

  // Extract the agent's response
  const responseMessage = String(
    agentResponse.agentResponse || intervention.prompt
  );

  console.log(
    `[Scheduler] Agent response: ${responseMessage.slice(0, 100)}...`
  );

  // Send notification
  const notificationResults = await sendNotification(
    intervention.userId,
    responseMessage,
    intervention
  );

  console.log(
    `[Scheduler] Notification sent via ${notificationResults.map((r) => r.channel).join(', ')}`
  );

  // Create notification record
  await createNotificationRecord(
    intervention.userId,
    intervention.taskId,
    responseMessage,
    intervention
  );

  // Log the intervention (using app_opened as placeholder - actual tracking via chat messages)
  await prisma.log.create({
    data: {
      type: 'app_opened',
      userId: intervention.userId,
      metadata: {
        taskId: intervention.taskId,
        interventionType: intervention.type,
        agentType: intervention.agentType,
        priority: intervention.priority,
        source: 'scheduler',
      },
    },
  });

  // Create follow-up based on intervention type
  await createFollowUpIfNeeded(intervention);
}

/**
 * Create follow-up task based on intervention type
 */
async function createFollowUpIfNeeded(intervention: Intervention): Promise<void> {
  const secretaryStateService = createSecretaryStateService(prisma);

  // Get task to check if it has blockers or is overdue
  const task = await prisma.task.findUnique({
    where: { id: intervention.taskId },
  });

  if (!task) {
    return;
  }

  let followUpType: 'blocked' | 'overdue' | 'check_progress' | 'celebration' | null = null;
  let reason = '';
  let scheduledFor = new Date();

  switch (intervention.type) {
    case 'consequence_warning':
      // Task is overdue - follow up in 24 hours
      followUpType = 'overdue';
      reason = 'Task is overdue, checking if user needs help or wants to reschedule';
      scheduledFor.setHours(scheduledFor.getHours() + 24);
      break;

    case 'progress_check':
      // Progress check - follow up in 48 hours if not completed
      followUpType = 'check_progress';
      reason = 'Checking progress on task after initial check-in';
      scheduledFor.setHours(scheduledFor.getHours() + 48);
      break;

    case 'idle_check':
      // User was idle - follow up in 6 hours to see if they got started
      followUpType = 'check_progress';
      reason = 'Following up after idle detection to see if user got started';
      scheduledFor.setHours(scheduledFor.getHours() + 6);
      break;

    case 'reminder':
      // If task has a deadline approaching, celebrate when completed
      if (task.deadline && new Date(task.deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000) {
        followUpType = 'celebration';
        reason = 'Celebrate completion of urgent task';
        scheduledFor = new Date(task.deadline);
        scheduledFor.setHours(scheduledFor.getHours() + 2); // 2 hours after deadline
      }
      break;
  }

  if (followUpType) {
    await secretaryStateService.addFollowUp(
      intervention.userId,
      intervention.taskId,
      followUpType,
      reason,
      scheduledFor
    );

    console.log(
      `[Scheduler] Created ${followUpType} follow-up for task ${intervention.taskId} scheduled for ${scheduledFor.toISOString()}`
    );
  }
}

/**
 * Send notification via appropriate channel(s)
 */
async function sendNotification(
  userId: string,
  message: string,
  intervention: Intervention
): Promise<Array<{ success: boolean; channel: string; error?: string }>> {
  const results: Array<{
    success: boolean;
    channel: string;
    error?: string;
  }> = [];

  // Get user with settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });

  if (!user) {
    return [
      {
        success: false,
        channel: 'push',
        error: 'User not found',
      },
    ];
  }

  // 1. Always create in-app chat message for persistence
  try {
    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId,
        taskId: intervention.taskId,
        content: message,
        role: 'assistant',
        metadata: {
          interventionType: intervention.type,
          agentType: intervention.agentType,
          priority: intervention.priority,
          timestamp: new Date().toISOString(),
        },
      },
    });

    results.push({
      success: true,
      channel: 'chat',
    });
  } catch (error) {
    console.error('Failed to create chat message:', error);
    results.push({
      success: false,
      channel: 'chat',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // 2. Send push notification if enabled and user has token
  if (user.settings?.notificationsEnabled && user.expoPushToken) {
    try {
      await sendPushNotification(user.expoPushToken, message, intervention);
      results.push({
        success: true,
        channel: 'push',
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
      results.push({
        success: false,
        channel: 'push',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

/**
 * Send Expo push notification
 */
async function sendPushNotification(
  expoPushToken: string,
  message: string,
  intervention: Intervention
) {
  // Validate Expo push token format
  if (!expoPushToken.startsWith('ExponentPushToken[')) {
    throw new Error('Invalid Expo push token format');
  }

  const EXPO_API_URL = 'https://exp.host/--/api/v2/push/send';

  // Get task title for notification
  const task = await prisma.task.findUnique({
    where: { id: intervention.taskId },
    select: { title: true },
  });

  const payload = {
    to: expoPushToken,
    sound: 'default',
    title: getNotificationTitle(intervention),
    body: message.slice(0, 200), // Limit to 200 chars for notification
    data: {
      taskId: intervention.taskId,
      interventionType: intervention.type,
      agentType: intervention.agentType,
      taskTitle: task?.title,
    },
    priority: intervention.priority >= 9 ? 'high' : 'default',
    channelId: getChannelId(intervention),
  };

  const response = await fetch(EXPO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Expo push notification failed: ${error}`);
  }

  const result = await response.json();

  // Check for errors in response
  if (result.data?.[0]?.status === 'error') {
    throw new Error(`Expo error: ${result.data[0].message}`);
  }

  return result;
}

/**
 * Get notification title based on intervention type
 */
function getNotificationTitle(intervention: Intervention): string {
  switch (intervention.type) {
    case 'reminder':
      return '⏰ Task Reminder';
    case 'progress_check':
      return '📊 Progress Check-in';
    case 'motivation':
      return '💪 Stay Motivated';
    case 'adaptation_suggestion':
      return '🔄 Task Update Needed';
    case 'consequence_warning':
      return '⚠️ Important Notice';
    case 'celebration':
      return '🎉 Congratulations!';
    case 'idle_check':
      return '👋 Need Help Getting Started?';
    default:
      return '📋 SmartTodos';
  }
}

/**
 * Get Android notification channel ID
 */
function getChannelId(intervention: Intervention): string {
  if (intervention.priority >= 9) {
    return 'urgent-tasks';
  }
  if (intervention.priority >= 7) {
    return 'important-tasks';
  }
  return 'default';
}

/**
 * Create a database notification record
 */
async function createNotificationRecord(
  userId: string,
  taskId: string,
  message: string,
  intervention: Intervention
) {
  return await prisma.notification.create({
    data: {
      userId,
      taskId,
      type: mapInterventionToNotificationType(intervention.type),
      message,
      mode: 'Push',
      trigger: 'RelativeTime',
      author: 'Bot',
      read: false,
      triggered: true,
      triggeredAt: new Date(),
    },
  });
}

/**
 * Map intervention type to notification type enum
 */
function mapInterventionToNotificationType(
  interventionType: string
): 'Reminder' | 'Question' | 'Info' {
  switch (interventionType) {
    case 'reminder':
      return 'Reminder';
    case 'progress_check':
      return 'Question';
    case 'motivation':
      return 'Info';
    case 'adaptation_suggestion':
      return 'Question';
    case 'consequence_warning':
      return 'Info';
    case 'celebration':
      return 'Info';
    case 'idle_check':
      return 'Question';
    default:
      return 'Info';
  }
}
