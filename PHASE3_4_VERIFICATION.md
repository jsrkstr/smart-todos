# Phase 3 & 4 Implementation Verification

**Date**: January 23, 2026
**Status**: ⚠️ **PARTIALLY COMPLETE**

---

## Original Plan Requirements

### Phase 3: Enhanced Scheduler (Week 5-6)
- ✅ Update intervention logic with context awareness
- ✅ Add interruptibility scoring
- ⚠️ Add location-based triggers
- ❌ Add idle detection triggers
- ⚠️ Test: Smarter notification timing

### Phase 4: Calendar Integration (Week 7)
- ❌ Integrate Google Calendar API
- ✅ Load events into external context
- ✅ Add free-time-block detection
- ✅ Add meeting-aware scheduling
- ❌ Test: Agents know about calendar

---

## Detailed Verification

## Phase 3: Enhanced Scheduler

### ✅ COMPLETED

#### 1. Context-Aware Intervention Logic
**File**: `apps/web/lib/scheduler/intervention-evaluator.ts` (386 lines)

**Features Implemented**:
- Intervention evaluation system with context awareness
- Historical context integration
- Physical context integration
- Safety-critical checks (driving, DND, battery, screen state)
- Notification fatigue protection (max 10/day, 1 hour minimum)
- Secretary aggressiveness settings respected

**Status**: ✅ Fully implemented

---

#### 2. Interruptibility Scoring
**File**: `apps/web/lib/scheduler/intervention-evaluator.ts:194-252`

**Algorithm Implemented**:
```typescript
calculateInterruptibilityScore(
  user: User & { settings?: Settings | null },
  historicalContext: HistoricalContext,
  physicalContext: PhysicalContext | null
): number
```

**Scoring Factors** (0-100 scale):
- Base score: 50
- Historical factors:
  - Notifications today >5: -20
  - App opened today: +10
  - Daily streak >7: +5
- Physical factors:
  - Stationary: +15
  - Walking: +5
  - Driving: 0 (immediate return)
  - Home location + off hours: +10
  - Work location + work hours: +10
  - Commuting: -5
  - DND: -30
  - Screen off: -20
  - Battery <20%: -10
  - Weekend: -5

**Status**: ✅ Fully implemented with 12+ contextual factors

---

#### 3. Location-Based Triggers
**File**: `apps/web/lib/scheduler/intervention-evaluator.ts:280-292`

**Features Implemented**:
```typescript
// Check if user is at optimal location for task
if (physicalContext && task.tags) {
  const tags = JSON.parse(JSON.stringify(task.tags));
  if (tags.includes('home') && physicalContext.locationType === 'home') {
    return 'reminder';
  }
  if (tags.includes('work') && physicalContext.locationType === 'work') {
    return 'reminder';
  }
  if (tags.includes('gym') && physicalContext.locationType === 'gym') {
    return 'reminder';
  }
}
```

**Location Types Supported**:
- home
- work
- gym
- commuting
- shopping
- restaurant
- unknown

**Location Matching**:
- Task tags are compared against current location type
- Triggers "reminder" intervention when user arrives at task location
- Uses `SavedLocation` model for geofencing (defined in Phase 2)

**Status**: ⚠️ **PARTIALLY IMPLEMENTED**
- ✅ Location-based intervention type selection
- ✅ Location matching with task tags
- ✅ Priority boost when at correct location (+2)
- ❌ Missing: Proactive "you just arrived" notifications
- ❌ Missing: Geofence trigger in mobile app to immediately notify scheduler

**What's Missing**:
The scheduler currently evaluates location context **when it runs** (every 15 minutes), but doesn't have a dedicated endpoint to trigger evaluation **when user changes location**. This means:
- User arrives at gym → scheduler might not run for up to 15 minutes
- Need: POST /api/scheduler/location-trigger endpoint
- Need: Mobile app calls this when significant location change detected

---

#### 4. Idle Detection Triggers
**Status**: ❌ **NOT IMPLEMENTED**

**What Was Planned**:
- Detect when user has been idle (no task interactions) for extended period
- Trigger check-in interventions: "Been idle 30 min - need help getting started?"
- Use activity detection (stationary for long duration)

**What Exists**:
- Physical context tracks `activityDurationMinutes` (how long in current activity)
- Activity types include 'stationary'
- ✅ Data structure supports idle detection

**What's Missing**:
1. **Idle Definition Logic**: No code that defines "idle" vs "stationary by choice"
   - Stationary for 2+ hours + no task updates = idle?
   - Need to query last task interaction timestamp

2. **Idle Intervention Type**: No `idle_check` intervention type
   - Currently only have: `reminder`, `motivation`, `progress_check`, `consequence_warning`

3. **Scheduler Integration**: No idle detection in scheduler
   ```typescript
   // MISSING CODE (example of what should exist):
   if (physicalContext.currentActivity === 'stationary' &&
       physicalContext.activityDurationMinutes > 120) {
     const lastTaskInteraction = await getLastTaskInteraction(userId);
     const idleMinutes = (Date.now() - lastTaskInteraction.getTime()) / 60000;

     if (idleMinutes > 30) {
       return {
         shouldIntervene: true,
         suggestedInterventionType: 'idle_check',
         reason: 'User idle for extended period'
       };
     }
   }
   ```

**Implementation Difficulty**: Medium
- Need to add task interaction tracking (last completed, last viewed, last updated)
- Need to define idle thresholds
- Need to add `idle_check` intervention type

---

#### 5. Scheduler Integration
**File**: `apps/web/app/api/scheduler/run-lifecycle-check/route.ts`

**Changes Made**:
```typescript
// Load contexts for this user
const historicalContext = await loadHistoricalContext(user.id);
const physicalContext = await loadPhysicalContext(user.id);

// Analyze each task with context-aware evaluation
const evaluator = createInterventionEvaluator(prisma);

for (const task of tasks) {
  const analysis = analyzeTask({ ...task, user: user });

  if (analysis.needsIntervention && analysis.intervention) {
    const evaluation = await evaluator.evaluateIntervention(
      user,
      task,
      historicalContext,
      physicalContext
    );

    if (evaluation.shouldIntervene && evaluation.optimalTiming === 'now') {
      analysis.intervention.priority = evaluation.suggestedPriority;
      analysis.intervention.type = evaluation.suggestedInterventionType as any;
      tasksNeedingAttention.push(analysis);
    }
  }
}
```

**Status**: ✅ Fully integrated

---

### Phase 3 Summary
| Requirement | Status | Completeness |
|------------|--------|--------------|
| Context-aware intervention logic | ✅ Complete | 100% |
| Interruptibility scoring | ✅ Complete | 100% |
| Location-based triggers | ⚠️ Partial | 70% |
| Idle detection triggers | ❌ Not Done | 0% |
| Testing | ⚠️ Partial | - |

**Overall Phase 3**: ⚠️ **~68% Complete**

---

## Phase 4: Calendar Integration

### ✅ COMPLETED

#### 1. External Context Service
**File**: `apps/agent/src/services/externalContextService.ts` (209 lines)

**Features Implemented**:
```typescript
export class ExternalContextService {
  async loadExternalContext(userId: string): Promise<ExternalContext>

  private calculateFreeTimeBlocks(
    events: Array<{ startTime: Date; endTime: Date }>,
    startTime: Date,
    endTime: Date
  ): Array<{ start: Date; end: Date; durationMinutes: number }>

  private getEmptyContext(): ExternalContext
}
```

**Status**: ✅ Fully implemented

---

#### 2. Load Events Into External Context
**File**: `apps/agent/src/services/externalContextService.ts:53-113`

**Features**:
- Loads events from all active calendar connections
- Filters events for today
- Excludes cancelled events
- Sorts by start time
- Detects next upcoming event (within 4 hours)
- Returns structured `ExternalContext` object

**Data Structure**:
```typescript
{
  eventsToday: [
    {
      title: "Team Standup",
      startTime: Date,
      endTime: Date,
      location: "Conference Room",
      isAllDay: false
    }
  ],
  nextEvent: {
    title: "Team Standup",
    startsInMinutes: 45,
    location: "Conference Room"
  },
  freeTimeBlocks: [...],
  hasCalendarConnected: true
}
```

**Status**: ✅ Fully implemented

---

#### 3. Free Time Block Detection
**File**: `apps/agent/src/services/externalContextService.ts:119-189`

**Algorithm**:
1. Sort events by start time
2. Find gap before first event (if >30 min)
3. Find gaps between consecutive events (if >30 min)
4. Find gap after last event (if >30 min)
5. Return all blocks with duration in minutes

**Example Output**:
```javascript
freeTimeBlocks: [
  { start: "9:00 AM", end: "10:00 AM", durationMinutes: 60 },
  { start: "10:30 AM", end: "2:00 PM", durationMinutes: 210 },
  { start: "3:00 PM", end: "6:00 PM", durationMinutes: 180 }
]
```

**Status**: ✅ Fully implemented with 30-minute minimum threshold

---

#### 4. Meeting-Aware Scheduling
**File**: `apps/agent/src/graph.ts:101-111`

**Integration**:
```typescript
// Load external context (calendar)
const externalContextService = createExternalContextService(prisma);
const externalContext = await externalContextService.loadExternalContext(state.userId);
updates.externalContext = externalContext;
if (externalContext && externalContext.hasCalendarConnected) {
  console.log('Loaded external context:', {
    eventsToday: externalContext.eventsToday.length,
    nextEvent: externalContext.nextEvent?.title,
    freeBlocks: externalContext.freeTimeBlocks.length,
  });
}
```

**State Integration**:
- ✅ Added to StateAnnotation in `types/index.ts`
- ✅ Loaded in `loadContext` node
- ✅ Available to all agents via state

**Status**: ✅ Data loading complete, ready for agent use

---

#### 5. Google Calendar API Integration
**Status**: ❌ **NOT IMPLEMENTED**

**What Exists**:
- ✅ Database schema for `CalendarConnection` and `CalendarEvent`
- ✅ API endpoints for CRUD operations (`/api/calendar-events`)
- ✅ Agent service to load events from database
- ✅ UI components for calendar connection (onboarding step)

**What's Missing**:
1. **OAuth Flow**: No Google OAuth implementation
   - Need: Google Cloud project setup
   - Need: OAuth 2.0 credentials
   - Need: Authorization flow endpoints
   - Need: Token storage and refresh

2. **Calendar Sync**: No automatic event syncing
   - Need: Google Calendar API client
   - Need: Webhook/polling for new events
   - Need: Sync service to fetch events periodically
   - Need: Event creation/update/deletion propagation

3. **Current State**: Manual calendar event entry only
   - Events can be manually created via API
   - No connection to actual Google Calendar
   - CalendarConnection exists but no provider integration

**Implementation File That Should Exist**:
```
apps/web/lib/integrations/google-calendar.ts (MISSING)
apps/web/app/api/calendar/connect/route.ts (MISSING)
apps/web/app/api/calendar/callback/route.ts (MISSING)
apps/web/app/api/calendar/sync/route.ts (MISSING)
```

**Implementation Difficulty**: High
- Requires Google Cloud setup
- OAuth flow complexity
- Token management
- Webhook handling
- Rate limiting considerations

---

#### 6. Agents Using Calendar Context
**Status**: ❌ **NOT IMPLEMENTED**

**What Exists**:
- ✅ External context loads successfully
- ✅ Available in state for all agents
- ✅ Logging shows context is loaded

**What's Missing**:
- ❌ No agent prompts reference external context
- ❌ Planning agent doesn't use free time blocks
- ❌ Execution coach doesn't mention upcoming meetings
- ❌ No "you have 45 minutes before your meeting" messaging

**Expected Implementation** (examples that don't exist):

**Planning Agent** (`apps/agent/src/agents/planning.ts`):
```typescript
// MISSING CODE:
const externalInfo = state.externalContext?.hasCalendarConnected ?
  `\n\n=== CALENDAR CONTEXT ===
Events Today: ${state.externalContext.eventsToday.length}
${state.externalContext.nextEvent ?
  `Next Event: "${state.externalContext.nextEvent.title}" in ${state.externalContext.nextEvent.startsInMinutes} min` :
  'No upcoming events'}

Free Time Blocks Available:
${state.externalContext.freeTimeBlocks.map(block =>
  `- ${block.durationMinutes} min window starting at ${block.start.toLocaleTimeString()}`
).join('\n')}

IMPORTANT: Schedule tasks within available free time blocks.
${state.externalContext.nextEvent?.startsInMinutes < 60 ?
  `⚠️ URGENT: Only ${state.externalContext.nextEvent.startsInMinutes} minutes until next meeting!` : ''}
` : '';

const prompt = ChatPromptTemplate.fromMessages([
  ['system', getSystemPrompt('planning')],
  ['human', `User request: {input}\n\n${taskContext}${externalInfo}`],
]);
```

**Execution Coach** (`apps/agent/src/agents/executionCoach.ts`):
```typescript
// MISSING CODE:
const calendarWarning = state.externalContext?.nextEvent?.startsInMinutes < 30 ?
  `\n\n⚠️ HEADS UP: You have "${state.externalContext.nextEvent.title}" in ${state.externalContext.nextEvent.startsInMinutes} minutes. Consider a quick task or take a break.` : '';
```

**Files That Need Modification**:
- `apps/agent/src/agents/planning.ts` - Add calendar context to prompts
- `apps/agent/src/agents/executionCoach.ts` - Add meeting awareness
- `apps/agent/src/agents/taskCreation.ts` - Suggest deadline based on calendar
- `apps/agent/src/agents/adaptation.ts` - Reschedule around meetings

**Implementation Difficulty**: Low to Medium
- Just need to add context to prompt templates
- Already have all the data loaded
- Straightforward string interpolation

---

### Phase 4 Summary
| Requirement | Status | Completeness |
|------------|--------|--------------|
| Google Calendar API integration | ❌ Not Done | 0% |
| Load events into external context | ✅ Complete | 100% |
| Free time block detection | ✅ Complete | 100% |
| Meeting-aware scheduling (data) | ✅ Complete | 100% |
| Agents using calendar context | ❌ Not Done | 0% |
| Testing | ❌ Not Done | - |

**Overall Phase 4**: ⚠️ **~60% Complete**

---

## Overall Implementation Status

### Phase 3: Enhanced Scheduler
**Status**: ⚠️ **68% Complete**

**What Works**:
✅ Context-aware intervention evaluation
✅ Interruptibility scoring algorithm
✅ Safety-critical checks (driving, DND)
✅ Notification fatigue protection
✅ Location-based intervention types
✅ Scheduler integration with contexts

**What's Missing**:
❌ Idle detection triggers (0%)
⚠️ Location-based proactive triggers (30% - reactive only)
❌ Comprehensive testing

---

### Phase 4: Calendar Integration
**Status**: ⚠️ **60% Complete**

**What Works**:
✅ Calendar event loading from database
✅ Free time block calculation
✅ External context service
✅ State integration in agent graph
✅ Manual calendar event CRUD API

**What's Missing**:
❌ Google Calendar OAuth integration (0%)
❌ Automatic calendar sync (0%)
❌ Agents using calendar in prompts (0%)
❌ Comprehensive testing

---

## Recommended Next Steps

### Priority 1: Complete Phase 4 Agent Integration (Low Effort, High Value)
**Estimated Time**: 2-3 hours

**Tasks**:
1. Add external context to Planning Agent prompts
2. Add external context to Execution Coach prompts
3. Add external context to Task Creation Agent prompts
4. Test agent responses with calendar data

**Files to Modify**:
- `apps/agent/src/agents/planning.ts`
- `apps/agent/src/agents/executionCoach.ts`
- `apps/agent/src/agents/taskCreation.ts`
- `apps/agent/src/agents/adaptation.ts`

**Impact**: Agents will immediately use calendar data for better recommendations

---

### Priority 2: Add Idle Detection (Medium Effort, Medium Value)
**Estimated Time**: 4-6 hours

**Tasks**:
1. Add task interaction tracking (lastViewed, lastUpdated timestamps)
2. Create idle detection logic in intervention evaluator
3. Add `idle_check` intervention type
4. Test idle detection scenarios

**Files to Create/Modify**:
- `apps/web/lib/scheduler/intervention-evaluator.ts` (add idle detection)
- Database schema updates for task interaction tracking
- Scheduler route integration

**Impact**: Proactive outreach when user appears stuck

---

### Priority 3: Location-Based Proactive Triggers (Medium Effort, High Value)
**Estimated Time**: 4-6 hours

**Tasks**:
1. Create POST /api/scheduler/location-trigger endpoint
2. Mobile app calls this on significant location change
3. Scheduler immediately evaluates location-tagged tasks
4. Send "you're at the gym!" notifications

**Files to Create/Modify**:
- `apps/web/app/api/scheduler/location-trigger/route.ts` (new)
- `apps/mobile-flutter/lib/core/services/location_service.dart` (add trigger)
- Test with real location changes

**Impact**: "You're at the grocery store - perfect time for shopping list!" notifications

---

### Priority 4: Google Calendar OAuth (High Effort, High Value)
**Estimated Time**: 16-20 hours

**Tasks**:
1. Google Cloud project setup
2. OAuth 2.0 flow implementation
3. Calendar sync service
4. Webhook handling
5. Token refresh logic
6. Error handling

**Files to Create**:
- `apps/web/lib/integrations/google-calendar.ts`
- `apps/web/app/api/calendar/connect/route.ts`
- `apps/web/app/api/calendar/callback/route.ts`
- `apps/web/app/api/calendar/sync/route.ts`

**Impact**: Automatic calendar sync instead of manual entry

---

## Testing Checklist

### Phase 3 Testing
- [ ] Test interruptibility scoring with various contexts
- [ ] Test driving safety (should never interrupt)
- [ ] Test DND mode respect
- [ ] Test notification fatigue limit (10/day)
- [ ] Test location-based intervention selection
- [ ] Test secretary aggressiveness settings
- [ ] Test intervention priority calculation

### Phase 4 Testing
- [ ] Test calendar event loading
- [ ] Test free time block calculation
- [ ] Test next event detection
- [ ] Test agents referencing calendar (AFTER agent integration)
- [ ] Test with no calendar connected
- [ ] Test with empty calendar
- [ ] Test with busy calendar (back-to-back meetings)

---

## Conclusion

**Overall Progress**: ~64% Complete (weighted average)

**Phase 3**: 68% - Core functionality works, missing idle detection and proactive location triggers

**Phase 4**: 60% - Data infrastructure complete, missing Google OAuth and agent prompt integration

**Critical Missing Pieces**:
1. ❌ Agents don't use calendar data in responses (HIGH PRIORITY - easy fix)
2. ❌ No Google Calendar sync (MEDIUM PRIORITY - requires OAuth)
3. ❌ No idle detection (MEDIUM PRIORITY - needs tracking)
4. ❌ Location triggers are reactive, not proactive (LOW PRIORITY - works but not optimal)

**Recommendation**: Start with Priority 1 (agent integration) - it's the quickest win and makes Phase 4 feel "complete" to users. The calendar data is already loading, agents just need to use it.

---

**Generated**: 2026-01-23
**Next Review**: After Priority 1 completion
