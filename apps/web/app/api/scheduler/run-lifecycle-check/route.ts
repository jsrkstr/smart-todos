import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processRequest } from '@smart-todos/agent';
import {
  analyzeTask,
  shouldNotifyUser,
} from '@/lib/scheduler/intervention-logic';
import {
  Intervention,
  SchedulerResult,
  TaskAnalysis,
} from '@/lib/scheduler/types';

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

    // Analyze each task
    for (const task of tasks) {
      const analysis = analyzeTask({
        ...task,
        user: user,
      });

      if (analysis.needsIntervention) {
        // Check if we recently sent an intervention for this task
        const recentIntervention = await hasRecentIntervention(
          task.id,
          SCHEDULER_CONFIG.minHoursBetweenInterventions
        );

        if (!recentIntervention) {
          tasksNeedingAttention.push(analysis);
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
    default:
      return 'Info';
  }
}
