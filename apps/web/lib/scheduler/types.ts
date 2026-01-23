export enum InterventionType {
  Reminder = 'reminder',
  ProgressCheck = 'progress_check',
  Motivation = 'motivation',
  AdaptationSuggestion = 'adaptation_suggestion',
  ConsequenceWarning = 'consequence_warning',
  Celebration = 'celebration',
}

export enum InterventionStatus {
  Pending = 'pending',
  Sent = 'sent',
  Responded = 'responded',
  Ignored = 'ignored',
  Cancelled = 'cancelled',
}

export interface Intervention {
  type: InterventionType;
  priority: number; // 1-10, higher = more urgent
  agentType:
    | 'taskCreation'
    | 'planning'
    | 'executionCoach'
    | 'adaptation'
    | 'analytics'
    | 'progressTracker';
  prompt: string;
  taskId: string;
  userId: string;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface TaskAnalysis {
  taskId: string;
  userId: string;
  needsIntervention: boolean;
  intervention?: Intervention;
  reason?: string;
}

export interface SchedulerConfig {
  enabled: boolean;
  batchSize: number;
  maxInterventionsPerUser: number;
  minHoursBetweenInterventions: number;
}

export interface SchedulerResult {
  tasksProcessed: number;
  interventionsCreated: number;
  notificationsSent: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}
