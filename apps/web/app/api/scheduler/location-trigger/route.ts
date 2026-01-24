import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware';
import { createInterventionEvaluator } from '@/lib/scheduler/intervention-evaluator';
import { processRequest } from '@smart-todos/agent';

/**
 * Location-Triggered Intervention Endpoint
 *
 * Called by mobile app when user arrives at a significant location.
 * Immediately evaluates if any location-tagged tasks should be surfaced.
 */
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const body = await req.json();
    const { locationType, savedLocationId } = body;

    if (!locationType) {
      return NextResponse.json(
        { error: 'locationType is required' },
        { status: 400 }
      );
    }

    console.log(
      `[LocationTrigger] User ${req.user.id} arrived at ${locationType}${savedLocationId ? ` (saved location: ${savedLocationId})` : ''}`
    );

    // Get user with settings
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        settings: true,
        psychProfile: {
          include: {
            coach: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if location-based notifications are enabled
    if (!user.settings?.notificationsEnabled) {
      return NextResponse.json({
        triggered: false,
        reason: 'Notifications disabled',
      });
    }

    // Get location name if saved location
    let locationName = locationType;
    if (savedLocationId) {
      const savedLocation = await prisma.savedLocation.findUnique({
        where: { id: savedLocationId },
      });
      if (savedLocation) {
        locationName = savedLocation.name;
      }
    }

    // Find tasks tagged with this location
    const locationTags = [locationType.toLowerCase()];
    if (locationName && locationName !== locationType) {
      locationTags.push(locationName.toLowerCase());
    }

    // Find incomplete tasks with matching location tags
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.id,
        completed: false,
        OR: locationTags.map((tag) => ({
          tags: {
            has: tag,
          },
        })),
      },
      orderBy: [
        { priority: 'desc' },
        { deadline: 'asc' },
      ],
      take: 5, // Limit to top 5 tasks
    });

    if (tasks.length === 0) {
      return NextResponse.json({
        triggered: false,
        reason: 'No location-tagged tasks found',
        locationType,
        locationName,
      });
    }

    console.log(
      `[LocationTrigger] Found ${tasks.length} tasks tagged for ${locationName}`
    );

    // Load contexts for evaluation
    const historicalContext = await loadHistoricalContext(req.user.id);
    const physicalContext = await loadPhysicalContext(req.user.id);

    // Check if we should intervene based on context
    const evaluator = createInterventionEvaluator(prisma);

    const approvedTasks = [];

    for (const task of tasks) {
      // Check if we recently sent an intervention for this task
      const recentIntervention = await hasRecentInterventionForTask(task.id, 6); // 6 hours

      if (recentIntervention) {
        console.log(
          `[LocationTrigger] Skipping task ${task.id} - recent intervention sent`
        );
        continue;
      }

      // Evaluate if we should intervene
      const evaluation = await evaluator.evaluateIntervention(
        user,
        task,
        historicalContext,
        physicalContext
      );

      if (evaluation.shouldIntervene && evaluation.optimalTiming === 'now') {
        approvedTasks.push({
          task,
          evaluation,
        });
      } else {
        console.log(
          `[LocationTrigger] Task ${task.id} blocked: ${evaluation.reason}`
        );
      }
    }

    if (approvedTasks.length === 0) {
      return NextResponse.json({
        triggered: false,
        reason: 'No tasks passed context evaluation',
        locationType,
        locationName,
        tasksChecked: tasks.length,
      });
    }

    // Send location-aware intervention for the top priority task
    const topTask = approvedTasks[0];

    // Generate message using agent
    const agentResponse = await processRequest(
      req.user.id,
      `I just arrived at ${locationName}. I have this task tagged for this location: "${topTask.task.title}". What should I do?`,
      {
        taskId: topTask.task.id,
        databaseUrl: process.env.DATABASE_URL,
      }
    );

    // Create intervention record
    await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        taskId: topTask.task.id,
        content: agentResponse.agentResponse || `You're at ${locationName}! Perfect timing for: ${topTask.task.title}`,
        role: 'assistant',
        type: 'Info',
      },
    });

    // Send push notification if enabled
    if (user.expoPushToken) {
      try {
        await sendLocationPushNotification(
          user.expoPushToken,
          locationName,
          topTask.task.title,
          approvedTasks.length
        );
      } catch (error) {
        console.error('[LocationTrigger] Failed to send push notification:', error);
      }
    }

    return NextResponse.json({
      triggered: true,
      locationType,
      locationName,
      tasksFound: tasks.length,
      tasksApproved: approvedTasks.length,
      interventionSent: true,
      task: {
        id: topTask.task.id,
        title: topTask.task.title,
      },
      message: agentResponse.agentResponse,
    });
  } catch (error) {
    console.error('[LocationTrigger] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process location trigger',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

/**
 * Check if we recently sent an intervention for this task
 */
async function hasRecentInterventionForTask(
  taskId: string,
  hours: number
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const recent = await prisma.chatMessage.findFirst({
    where: {
      taskId,
      role: 'assistant',
      createdAt: { gte: cutoff },
    },
  });

  return !!recent;
}

/**
 * Load historical context
 */
async function loadHistoricalContext(userId: string) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [notificationsToday, tasksToday, tasksWeek, streak, overdueCount, appOpenToday] =
    await Promise.all([
      prisma.chatMessage.count({
        where: {
          userId,
          role: 'assistant',
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          completed: true,
          updatedAt: { gte: startOfToday },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          completed: true,
          updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.streak.findFirst({
        where: {
          userId,
          type: 'daily',
        },
        orderBy: { count: 'desc' },
      }),
      prisma.task.count({
        where: {
          userId,
          completed: false,
          deadline: { lt: now },
        },
      }),
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
    pomodorosCompletedToday: 0,
    totalFocusMinutesToday: 0,
    averageMoodThisWeek: null,
    overdueTaskCount: overdueCount,
    appOpenedToday: !!appOpenToday,
  };
}

/**
 * Load physical context
 */
async function loadPhysicalContext(userId: string) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const latestContext = await prisma.userContext.findFirst({
    where: { userId },
    orderBy: { timestamp: 'desc' },
  });

  if (!latestContext || latestContext.timestamp < thirtyMinutesAgo) {
    return null;
  }

  return {
    currentActivity: latestContext.activity as any,
    activityConfidence: latestContext.confidence,
    locationType: latestContext.locationType as any,
    isAtSavedLocation: !!latestContext.savedLocationId,
    savedLocationName: undefined,
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
 * Send location-based push notification
 */
async function sendLocationPushNotification(
  expoPushToken: string,
  locationName: string,
  taskTitle: string,
  totalTasks: number
) {
  const message = {
    to: expoPushToken,
    sound: 'default' as const,
    title: `📍 You're at ${locationName}!`,
    body:
      totalTasks > 1
        ? `Perfect timing for "${taskTitle}" and ${totalTasks - 1} more task${totalTasks > 2 ? 's' : ''}`
        : `Perfect timing for: ${taskTitle}`,
    data: {
      type: 'location_trigger',
      locationName,
    },
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Push notification failed: ${response.statusText}`);
  }

  return response.json();
}
