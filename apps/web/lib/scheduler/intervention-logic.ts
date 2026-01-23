import { Task, User, PsychProfile, Coach } from '@prisma/client';
import { Intervention, InterventionType, TaskAnalysis } from './types';

type TaskWithRelations = Task & {
  user?: User & {
    psychProfile?: (PsychProfile & {
      coach?: Coach | null;
    }) | null;
  };
};

/**
 * Determines if a task needs intervention and what type
 */
export function analyzeTask(task: TaskWithRelations): TaskAnalysis {
  const now = new Date();

  // Skip completed tasks
  if (task.completed) {
    return {
      taskId: task.id,
      userId: task.userId,
      needsIntervention: false,
      reason: 'Task already completed',
    };
  }

  // Calculate time-based metrics
  const deadlineHours = task.deadline
    ? (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    : null;

  const hoursSinceUpdate =
    (now.getTime() - task.updatedAt.getTime()) / (1000 * 60 * 60);
  const daysSinceCreation =
    (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // Priority 10: Overdue tasks
  if (deadlineHours !== null && deadlineHours < 0) {
    return {
      taskId: task.id,
      userId: task.userId,
      needsIntervention: true,
      intervention: {
        type: InterventionType.AdaptationSuggestion,
        priority: 10,
        agentType: 'adaptation',
        prompt: `Task "${task.title}" is overdue by ${Math.abs(Math.round(deadlineHours))} hours. Analyze rescheduling options, explain the consequences of continued delay, and suggest realistic alternatives that fit the user's schedule.`,
        taskId: task.id,
        userId: task.userId,
        metadata: {
          hoursOverdue: Math.abs(deadlineHours),
          originalDeadline: task.deadline,
        },
      },
      reason: 'Task is overdue',
    };
  }

  // Priority 9: Approaching deadline (within 24 hours)
  if (deadlineHours !== null && deadlineHours > 0 && deadlineHours < 24) {
    return {
      taskId: task.id,
      userId: task.userId,
      needsIntervention: true,
      intervention: {
        type: InterventionType.Reminder,
        priority: 9,
        agentType: 'executionCoach',
        prompt: `Task "${task.title}" is due in ${Math.round(deadlineHours)} hours. Provide urgent but supportive motivation to help the user complete it. Consider their current context and energy levels. Suggest breaking it down if needed.`,
        taskId: task.id,
        userId: task.userId,
        metadata: {
          hoursUntilDeadline: deadlineHours,
          urgency: 'high',
        },
      },
      reason: 'Deadline approaching within 24 hours',
    };
  }

  // Priority 8: Stuck in stage for >3 days
  if (hoursSinceUpdate > 72 && task.stageStatus !== 'Completed') {
    return {
      taskId: task.id,
      userId: task.userId,
      needsIntervention: true,
      intervention: {
        type: InterventionType.ProgressCheck,
        priority: 8,
        agentType: 'executionCoach',
        prompt: `Task "${task.title}" has been in ${task.stage} stage for ${Math.round(hoursSinceUpdate / 24)} days with status "${task.stageStatus}". Check in with the user about their progress. Ask what's blocking them. Offer help or suggest adapting the approach.`,
        taskId: task.id,
        userId: task.userId,
        metadata: {
          hoursSinceUpdate,
          currentStage: task.stage,
          currentStatus: task.stageStatus,
        },
      },
      reason: 'Task stuck in same stage for >72 hours',
    };
  }

  // Priority 7: Deadline within 2-7 days (moderate urgency)
  if (deadlineHours !== null && deadlineHours > 24 && deadlineHours < 168) {
    const daysUntilDeadline = Math.round(deadlineHours / 24);
    return {
      taskId: task.id,
      userId: task.userId,
      needsIntervention: true,
      intervention: {
        type: InterventionType.Reminder,
        priority: 7,
        agentType: 'executionCoach',
        prompt: `Task "${task.title}" is due in ${daysUntilDeadline} days. Provide a friendly reminder and help the user plan when to work on it. Consider their schedule and suggest optimal time slots based on their productivity patterns.`,
        taskId: task.id,
        userId: task.userId,
        metadata: {
          daysUntilDeadline,
          urgency: 'moderate',
        },
      },
      reason: `Deadline in ${daysUntilDeadline} days`,
    };
  }

  // Priority 6: Scheduled for today
  if (task.date && isSameDay(task.date, now)) {
    return {
      taskId: task.id,
      userId: task.userId,
      needsIntervention: true,
      intervention: {
        type: InterventionType.Reminder,
        priority: 6,
        agentType: 'executionCoach',
        prompt: `Task "${task.title}" is scheduled for today. Check if the user is ready to work on it. Suggest starting with the first small step to build momentum. Estimated time: ${task.estimatedTimeMinutes || 25} minutes.`,
        taskId: task.id,
        userId: task.userId,
        metadata: {
          scheduledDate: task.date,
          estimatedTimeMinutes: task.estimatedTimeMinutes,
        },
      },
      reason: 'Task scheduled for today',
    };
  }

  // Priority 5: Task in Refinement stage for >2 days (needs attention)
  if (task.stage === 'Refinement' && daysSinceCreation > 2) {
    return {
      taskId: task.id,
      userId: task.userId,
      needsIntervention: true,
      intervention: {
        type: InterventionType.Reminder,
        priority: 5,
        agentType: 'planning',
        prompt: `Task "${task.title}" has been in Refinement stage for ${Math.round(daysSinceCreation)} days. Help the user move forward by suggesting task breakdown and planning. Ask if they need help clarifying the goal or breaking it into smaller steps.`,
        taskId: task.id,
        userId: task.userId,
        metadata: {
          daysSinceCreation,
          currentStage: task.stage,
        },
      },
      reason: 'Task stuck in Refinement stage',
    };
  }

  // Priority 4: High priority tasks not started
  if (
    task.priority === 'high' &&
    task.stageStatus === 'NotStarted' &&
    daysSinceCreation > 1
  ) {
    return {
      taskId: task.id,
      userId: task.userId,
      needsIntervention: true,
      intervention: {
        type: InterventionType.Motivation,
        priority: 4,
        agentType: 'executionCoach',
        prompt: `High priority task "${task.title}" hasn't been started yet. Motivate the user to take the first step. Explain why this task matters (reason: ${task.why || "user's goal"}). Help them overcome initial resistance.`,
        taskId: task.id,
        userId: task.userId,
        metadata: {
          priority: task.priority,
          daysSinceCreation,
          why: task.why,
        },
      },
      reason: 'High priority task not started',
    };
  }

  // No intervention needed
  return {
    taskId: task.id,
    userId: task.userId,
    needsIntervention: false,
    reason: 'Task in good state, no intervention needed',
  };
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Determine optimal notification time based on user profile
 */
export function determineNotificationTiming(
  user: User & { psychProfile?: PsychProfile | null },
  intervention: Intervention
): Date {
  const now = new Date();

  // For urgent interventions, send immediately
  if (intervention.priority >= 9) {
    return now;
  }

  // Use user's productivity time preference if available
  if (user.psychProfile?.productivityTime) {
    const preferredHour = getPreferredHour(
      user.psychProfile.productivityTime
    );
    const scheduledTime = new Date(now);
    scheduledTime.setHours(preferredHour, 0, 0, 0);

    // If preferred time already passed today, schedule for next occurrence
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return scheduledTime;
  }

  // Default: send within next hour
  const defaultTime = new Date(now);
  defaultTime.setMinutes(defaultTime.getMinutes() + 30);
  return defaultTime;
}

/**
 * Map productivity time preference to hour of day
 */
function getPreferredHour(productivityTime: string): number {
  switch (productivityTime) {
    case 'morning':
      return 9; // 9 AM
    case 'afternoon':
      return 14; // 2 PM
    case 'evening':
      return 18; // 6 PM
    case 'night':
      return 21; // 9 PM
    default:
      return 10; // Default to 10 AM
  }
}

/**
 * Check if user should receive intervention based on their preferences
 */
export function shouldNotifyUser(
  user: User & { psychProfile?: PsychProfile | null },
  intervention: Intervention
): boolean {
  // Always send urgent interventions (priority >= 9)
  if (intervention.priority >= 9) {
    return true;
  }

  // Check communication preference
  if (user.psychProfile?.communicationPref === 'minimal') {
    // Only send high priority interventions for minimal users
    return intervention.priority >= 8;
  }

  if (user.psychProfile?.communicationPref === 'moderate') {
    // Send medium-high priority interventions
    return intervention.priority >= 6;
  }

  // 'frequent' or no preference - send all interventions
  return true;
}
