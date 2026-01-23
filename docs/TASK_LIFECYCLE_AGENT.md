# Task Lifecycle Agent Architecture

## Overview

The Task Lifecycle Agent is an AI-powered system that manages the complete lifecycle of user tasks, from creation to completion. It proactively monitors task states, provides timely interventions (reminders, motivation, adaptation suggestions), and helps users stay on track with their goals.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         Background Scheduler Service                │
│  (Triggered by cron-job.org every 15 minutes)      │
│                                                      │
│  • Checks tasks periodically                        │
│  • Determines which tasks need attention            │
│  • Invokes LangGraph agents for each task          │
│  • Sends notifications via multiple channels        │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│      Existing LangGraph Multi-Agent System          │
│                                                      │
│  ┌────────────────┐  ┌─────────────────┐           │
│  │  Execution     │  │   Adaptation    │           │
│  │  Coach Agent   │  │   Agent         │           │
│  │                │  │                 │           │
│  │ • Reminders    │  │ • Reschedule    │           │
│  │ • Motivation   │  │ • Adapt plans   │           │
│  │ • Questions    │  │ • Consequences  │           │
│  └────────────────┘  └─────────────────┘           │
│                                                      │
│  ┌────────────────┐  ┌─────────────────┐           │
│  │  Analytics     │  │   Planning      │           │
│  │  Agent         │  │   Agent         │           │
│  │                │  │                 │           │
│  │ • Progress     │  │ • Breakdown     │           │
│  │ • Insights     │  │ • Sub-tasks     │           │
│  └────────────────┘  └─────────────────┘           │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│        Notification Delivery System                 │
│                                                      │
│  • Push notifications (Expo)                        │
│  • In-app chat messages                             │
│  • Email (future)                                   │
│  • SMS (future)                                     │
│  • WhatsApp/Telegram (future via integrations)     │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. Background Scheduler Service

**Location**: `apps/agent/src/scheduler/`

**Purpose**: Identifies tasks needing attention and triggers appropriate agent interventions.

**Trigger**: External HTTP endpoint called by cron-job.org every 15 minutes

**Key Responsibilities**:
- Query database for tasks in various states
- Apply intervention logic to determine which tasks need attention
- Invoke the LangGraph supervisor with appropriate prompts
- Queue notifications based on agent responses

### 2. Multi-Agent System (Existing)

**Location**: `apps/agent/src/agents/`

**Agents**:
- **Supervisor**: Routes requests to appropriate specialized agents
- **Execution Coach**: Provides motivation, reminders, coaching advice
- **Adaptation Agent**: Handles rescheduling, consequence analysis, plan adjustments
- **Planning Agent**: Breaks down tasks, creates subtasks
- **Analytics Agent**: Provides insights, metrics, progress tracking
- **Progress Tracker** (New): Generates questions to check task progress

### 3. Notification Service

**Location**: `apps/agent/src/services/notification.ts`

**Channels**:
1. **Push Notifications** (Expo) - Primary channel for mobile users
2. **In-App Chat** - Using ChatMessage model for persistent communication
3. **Email** - For less urgent notifications (future)
4. **SMS/WhatsApp/Telegram** - For critical reminders (future)

## Intervention Types

Based on task state and user profile, the system determines appropriate interventions:

### 1. Reminders
**Agent**: Execution Coach
**Trigger**:
- Task scheduled for today/soon
- Task approaching deadline
- User's optimal productivity time

**Examples**:
- "Hey John, got 5 mins to do 'Buy groceries'?"
- "Ready to tackle 'Finish report'? It takes only 25 mins"

### 2. Progress Questions
**Agent**: Progress Tracker
**Trigger**:
- Task stuck in same stage for >72 hours
- No activity detected for extended period

**Examples**:
- **Direct**: "Did you finish 'Learn Spanish'?"
- **Indirect**: "Do you know what 'Rio' means in Spanish?" (AI-generated)

### 3. Adaptation Suggestions
**Agent**: Adaptation Agent
**Trigger**:
- Task postponed multiple times
- Task overdue
- Deadline conflicts detected

**Examples**:
- "This task has been postponed 3 times. Let's reschedule realistically."
- "Rescheduling this will delay Project X by 5 days. Still proceed?"

### 4. Consequence Analysis
**Agent**: Adaptation Agent
**Trigger**:
- User requests reschedule
- Task at risk of missing deadline

**Examples**:
- "If you skip this: Tasks A, B will be blocked"
- "Rescheduling to next week: Project deadline still achievable"

### 5. Motivation & Celebration
**Agent**: Execution Coach
**Trigger**:
- Task completed
- Milestone reached
- Streak achieved

**Examples**:
- "Congratulations! You built a 7-day streak!"
- "You're on fire! 5 tasks completed today!"

## Intervention Logic

### Task States Requiring Intervention

```typescript
// Overdue tasks (Priority: 10)
if (task.deadline && task.deadline < now && !task.completed) {
  return { type: 'adaptation_suggestion', agent: 'adaptation' };
}

// Approaching deadline (Priority: 9)
if (task.deadline && hoursUntilDeadline < 24 && !task.completed) {
  return { type: 'urgent_reminder', agent: 'executionCoach' };
}

// Stuck in stage (Priority: 7)
if (hoursSinceLastUpdate > 72 && task.stageStatus !== 'Completed') {
  return { type: 'progress_check', agent: 'progressTracker' };
}

// Scheduled for today (Priority: 6)
if (task.date && isSameDay(task.date, now) && !task.completed) {
  return { type: 'reminder', agent: 'executionCoach' };
}

// Postponed multiple times (Priority: 8)
if (postponementCount > 3) {
  return { type: 'adaptation_suggestion', agent: 'adaptation' };
}
```

### Smart Timing

Notifications are timed based on:
- **User's PsychProfile**: `productivityTime`, `communicationPref`
- **Historical activity patterns**: Logged active hours from `Log` table
- **Task priority**: High priority = more frequent reminders
- **User response history**: Learn from past interactions

## Database Schema

### New Tables

```prisma
model ScheduledIntervention {
  id            String   @id @default(cuid())
  type          InterventionType
  taskId        String
  userId        String
  scheduledFor  DateTime
  status        InterventionStatus @default(pending)
  priority      Int      @default(5) // 1-10
  prompt        String   @db.Text
  agentType     String?  // Which agent to invoke
  metadata      Json?    // Additional context
  createdAt     DateTime @default(now())
  executedAt    DateTime?

  task          Task     @relation(fields: [taskId], references: [id])
  user          User     @relation(fields: [userId], references: [id])

  @@index([scheduledFor, status])
  @@index([userId, status])
}

model InterventionHistory {
  id              String   @id @default(cuid())
  interventionId  String
  userResponse    String?  // "completed", "snoozed", "ignored"
  responseTime    DateTime?
  effectiveScore  Float?   // ML can learn from this
  metadata        Json?
  createdAt       DateTime @default(now())
}

enum InterventionType {
  reminder
  progress_check
  motivation
  adaptation_suggestion
  consequence_warning
  celebration
}

enum InterventionStatus {
  pending
  sent
  responded
  ignored
  cancelled
}
```

## Task Lifecycle Stages

Tasks flow through these stages, each monitored by the lifecycle agent:

| Stage | Agent(s) | Interventions |
|-------|----------|---------------|
| **Refinement** | TaskCreation | Help complete task details, set deadlines |
| **Breakdown** | Planning | Suggest subtasks, apply "tiny experiments" |
| **Planning** | Planning | Prioritize subtasks, optimize order |
| **Execution** | Execution Coach, Progress Tracker | Reminders, motivation, progress checks |
| **Reflection** | Analytics | Celebration, insights, learning points |

## API Endpoints

### Scheduler Endpoint
```
POST /api/scheduler/run-lifecycle-check
Authorization: Bearer <SCHEDULER_SECRET>

Response:
{
  "tasksProcessed": 15,
  "interventionsCreated": 8,
  "notificationsSent": 5,
  "duration": "3.2s"
}
```

### Manual Trigger (Admin)
```
POST /api/scheduler/trigger-intervention
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "userId": "user_123",
  "taskId": "task_456",
  "interventionType": "reminder"
}
```

## Configuration

### Environment Variables

```bash
# Scheduler
SCHEDULER_SECRET=<random-secret-for-cron-job>
SCHEDULER_ENABLED=true
SCHEDULER_BATCH_SIZE=50

# Notifications
EXPO_ACCESS_TOKEN=<expo-token>
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=false

# Agent Settings
DEFAULT_LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.3
```

### User Preferences

Users can configure:
- **Communication frequency**: Minimal, Moderate, Frequent
- **Notification channels**: Push, Email, SMS
- **Quiet hours**: Don't disturb during specified times
- **Intervention types**: Enable/disable specific intervention types

Stored in `PsychProfile` and `Settings` models.

## Implementation Phases

### Phase 1 (Current) ✅
- Background scheduler service with HTTP endpoint
- Basic intervention logic (overdue, approaching deadline, scheduled)
- Integration with existing LangGraph agents
- Expo push notification support

### Phase 2 (Future)
- Progress Tracker agent for indirect questions
- Consequence analysis in Adaptation agent
- Email notification channel
- Intervention effectiveness tracking

### Phase 3 (Future)
- ML-powered optimal timing prediction
- SMS/WhatsApp/Telegram integrations
- Voice call reminders for critical tasks
- Multi-language support

### Phase 4 (Future)
- Cross-user coordination (accountability partners)
- Team task management
- Advanced gamification (competitions, rewards)

## Monitoring & Analytics

Track these metrics:
- **Intervention effectiveness**: Response rate by type
- **User engagement**: Time from notification to action
- **Task completion rate**: Before/after lifecycle agent
- **Agent performance**: Response quality, execution time
- **Notification delivery**: Success rate by channel

## Security Considerations

1. **Scheduler endpoint**: Protected by secret token
2. **User data**: PII masked in logs
3. **Rate limiting**: Max interventions per user per day
4. **Notification opt-out**: Users can disable anytime
5. **Data retention**: Intervention history purged after 90 days

## Resources

- **LangGraph docs**: https://langchain-ai.github.io/langgraph/
- **Expo Push Notifications**: https://docs.expo.dev/push-notifications/
- **cron-job.org**: https://cron-job.org/en/
- **Product Plan**: `/product-plan.txt`

## Related Files

- Agent implementation: `apps/agent/src/agents/`
- Scheduler service: `apps/agent/src/scheduler/`
- Database schema: `apps/web/prisma/schema.prisma`
- Notification service: `apps/agent/src/services/notification.ts`
