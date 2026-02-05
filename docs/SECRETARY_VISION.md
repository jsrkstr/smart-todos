# AI Personal Secretary - Vision & Design

## Overview

Transform SmartTodos from a reactive task assistant into a **proactive, omniscient personal secretary** that knows the user's context across all dimensions: digital activity, physical state, location, calendar, and behavioral patterns.

---

## The Core Philosophy

The best secretary is one you barely notice until you need them. They:
- **Anticipate needs** before you articulate them
- **Protect your focus** by filtering interruptions
- **Remember everything** so you don't have to
- **Adapt to you** rather than forcing you to adapt

**Key Insight:** A secretary's value isn't just in doing tasks—it's in knowing when NOT to interrupt, recognizing the right moment to help, and building a mental model of the person over time.

---

## The Four Context Layers

### Layer 1: Historical Activity Context

What happened in the app previously:

- Recent app activity (opens, session duration)
- Notification history (what was sent, when, user response)
- Task completion patterns (completed today/week, average times)
- Pomodoro sessions (focus time, completion rate)
- Mood & energy tracking (recent moods, weekly average)
- Streaks & achievements (current streak, longest streak)
- Communication patterns (last message, response frequency)

**Implementation Status:** ✅ Starting Phase 1

### Layer 2: Real-Time Physical Context

User's real-world state:

- **Activity detection**: Stationary, walking, running, driving, unknown
- **Location context**: Home, work, commuting, saved locations (privacy-preserving)
- **Device state**: Screen on/off, battery level, charging, Do Not Disturb
- **Time context**: Local time, timezone, weekday/weekend, working hours

**Mobile sensors:** Accelerometer, location (with permission), device info

### Layer 3: External Integration Context

Data from external services:

- **Calendar**: Events today, next event, free time blocks
- **Weather**: Current conditions, outdoor task feasibility
- **Focus mode**: System Do Not Disturb status

**Integrations:** Google Calendar, Apple Calendar, weather API

### Layer 4: Behavioral Patterns

Learned over time from historical data:

- **Productivity patterns**: Most/least productive hours, tasks per day
- **Task preferences**: Preferred duration, break frequency, urgency response
- **Communication patterns**: Responds best to reminders/motivation/questions
- **Completion patterns**: Early finisher, procrastinator, works in bursts
- **Time estimation**: Accuracy of user estimates, typical error percentage

**Machine learning:** Pattern analysis service computes daily/weekly

---

## Secretary Interaction Scenarios

### Scenario 1: Morning Briefing

```
Context: User opens app at 8:30 AM, at home, sedentary for 20 min
Historical: Completed 2/5 tasks yesterday, mood was 3/5
Calendar: Meeting at 10 AM, lunch meeting at 12:30

Secretary: "Good morning! You have 90 minutes before your 10 AM meeting.
Yesterday was tough - only 2 tasks done and energy seemed low.
Today you have 3 high-priority items. Given your morning meeting
and lunch commitment, I'd suggest tackling 'Review Q4 budget' now
while you're fresh. It's your most cognitively demanding task and
fits perfectly in this window. Want me to start a focus timer?"
```

### Scenario 2: Idle Detection

```
Context: User has been stationary for 45 min, last task touch 2 hours ago
Historical: Usually completes tasks in morning, it's now 2 PM
Physical: At work location, screen has been on

Secretary: "Noticed you've been in the same spot for a while.
You knocked out 3 tasks this morning - nice work!
Afternoon slump hitting? You have 'Call dentist' on your list -
only takes 5 minutes and doesn't need deep focus.
Perfect post-lunch task. Or if you need a real break,
that's okay too - you're ahead of pace for the week."
```

### Scenario 3: Location-Triggered

```
Context: User just arrived at "Grocery Store" saved location
Task: "Buy ingredients for dinner party" tagged with location

Secretary: "You're at the store! Perfect timing for
'Buy ingredients for dinner party'. Here's the list:
- Salmon (2 lbs)
- Asparagus
- Lemons
- Heavy cream

The dinner party is Saturday, so this is right on schedule.
Mark as done when you checkout?"
```

### Scenario 4: Energy-Aware Scheduling

```
Context: User marked mood as 2/5 on last task
Patterns: Low energy correlates with reduced completion
Tasks: High-priority 'Write proposal' due tomorrow

Secretary: "I noticed your energy is low right now.
'Write proposal' is due tomorrow, but it needs focus.
Two options:
1. Do it now with a 25-min pomodoro - I'll keep it short
2. Reschedule to tomorrow 9 AM (your peak productivity time)

You have a 2-hour block free tomorrow morning.
What feels right?"
```

### Scenario 5: Pattern Intervention

```
Pattern: User consistently pushes 'Exercise' task to next day
Historical: Task has been rescheduled 5 times in 2 weeks
Context: User just completed work tasks, it's 5:30 PM

Secretary: "Can we talk about 'Exercise'? It's been rescheduled
5 times now. I'm not here to guilt you - but I want to help.

A few options:
1. Reduce scope: 'Exercise' → '10-minute walk'
2. Change time: You seem most free after 5 PM
3. Remove it: If it's not serving you right now, that's okay
4. Accountability: I can check in more frequently

What would actually help?"
```

---

## The Five Secretary Modes

### 1. Guardian Mode (Default)
- Protect focus time
- Filter non-urgent interruptions
- Queue messages for appropriate times
- Shield from notification fatigue

### 2. Briefing Mode (Morning/transitions)
- Summarize what's changed
- Preview the day/next session
- Highlight priorities
- Surface forgotten items

### 3. Coaching Mode (When struggling)
- Detect procrastination patterns
- Offer emotional support
- Break down overwhelming tasks
- Celebrate small wins

### 4. Planning Mode (Weekly/project start)
- Help set goals
- Allocate time blocks
- Identify conflicts
- Suggest optimal scheduling

### 5. Crisis Mode (Urgent situations)
- Override DND for critical items
- Provide immediate action steps
- Clear the path for focus
- Handle rescheduling automatically

---

## Digital Twin Concept

Build a computational model of the user's work patterns:

**Energy Model:**
- Energy levels by hour (0-100 for each hour)
- Energy by day of week (Monday fatigue vs Friday excitement)
- Energy drain after meetings
- Energy boost after exercise

**Focus Model:**
- Max deep work duration
- Optimal session length
- Break frequency needed
- Distractibility by time of day

**Task Affinity Model:**
- Prefers creative work: morning/afternoon/evening
- Prefers admin work: morning/afternoon/evening
- Avoids certain task types
- Procrastinates on specific tags

**Social Model:**
- Preferred alone time (hours/day)
- Meeting tolerance (max meetings/day)
- Responsive to messages (yes/no)
- Needs accountability (yes/no)

**Motivation Model:**
- Responds to deadlines (yes/no)
- Responds to rewards (yes/no)
- Responds to social pressure (yes/no)
- Trigger words (words that motivate)
- Avoid words (words that demotivate)

---

## Proactive Intervention Taxonomy

| Trigger Type | Context Required | Example |
|-------------|------------------|---------|
| **Time-based** | Calendar + patterns | "Your 2 PM creative window is starting" |
| **Location-based** | GPS + saved places | "You're near the hardware store" |
| **Activity-based** | Accelerometer | "Been sitting 2 hours - stretch?" |
| **Energy-based** | Mood + patterns | "Energy low? Here's a quick-win task" |
| **Deadline-based** | Tasks + calendar | "Proposal due in 4 hours, gap now" |
| **Social-based** | Shared tasks | "Sarah finished her part - unblocked" |
| **Pattern-based** | Historical data | "You skip exercise Fridays - commit?" |
| **Weather-based** | Weather API | "Rain tomorrow - outdoor task today?" |
| **Idle-based** | Activity + screen | "Idle 30 min - need help starting?" |
| **Completion-based** | Task finish | "Nice! Crushed that. Next?" |

---

## Gentle Nudge Psychology

Instead of nagging, use psychological principles:

1. **Implementation Intentions**
   - "When you finish this meeting, will you start the report?"
   - Ties behavior to existing cues

2. **Temptation Bundling**
   - "Listen to your podcast while doing expense reports?"
   - Pairs unpleasant with pleasant

3. **Commitment Devices**
   - "Want me to tell Sarah you'll have this by 3 PM?"
   - Social accountability

4. **Fresh Start Effect**
   - "New week! Perfect time to tackle that backlog"
   - Leverage temporal landmarks

5. **Progress Illusion**
   - "You're 3/5 done with today's tasks"
   - Show momentum even when starting

6. **Autonomy Preservation**
   - "Would you prefer X or Y?"
   - Always give choices, never commands

---

## Creative Feature Ideas

### Life Domains Integration

Track tasks across life domains with energy pools:

```
Work: [========--] 80% capacity
Health: [===-------] 30% capacity
Family: [====------] 40% capacity
Personal: [==========] Full - needs attention
```

Secretary: "You've been crushing work but personal goals neglected. How about 'Read 20 pages' tonight?"

### Future Self Letters

- "A week ago, you said you'd have X done by now. How's it going?"
- "In your planning session, you predicted Y. Should we adjust?"

### Friction Detection

- "You've started 'Write blog post' 4 times but never finished. What's blocking you?"
- Pattern: User always stalls on tasks tagged 'creative'

### Energy Banking

Track energy like a resource:
- Morning: +50 energy (well rested)
- After meeting: -20 energy
- After lunch: -10 energy
- After task completion: +5 energy

Secretary: "Energy at 25%. Tackle 'Easy emails' or take a break?"

### Relationship Maintenance

- "You haven't contacted Mom in 2 weeks - add a reminder?"
- "Sarah's birthday Friday - she's tagged on 3 tasks"

---

## What Makes This Different

| Feature | Typical Todo App | AI Secretary |
|---------|-----------------|--------------|
| Task input | Manual entry | Conversation + inference |
| Reminders | Fixed time | Context-aware moments |
| Prioritization | User-assigned | Learned + suggested |
| Scheduling | Manual | Auto-optimized to energy/calendar |
| Progress tracking | Checkboxes | Holistic life dashboard |
| Motivation | Gamification | Personalized coaching |
| Adaptation | None | Learns and evolves |
| Proactivity | Passive | Active partnership |

---

## Privacy Principles

1. **Location Data**
   - Only store location type, not exact coordinates
   - User explicitly saves locations (opt-in)
   - No tracking without permission
   - Data deleted after 30 days

2. **Activity Data**
   - On-device processing where possible
   - Only send activity type, not raw sensor data
   - User can disable in settings

3. **Behavioral Patterns**
   - Derived from user's own data
   - Never shared externally
   - User can view and delete

4. **Calendar Integration**
   - Read-only access
   - Only event titles/times, not details
   - OAuth with minimal scopes

---

## User Settings

Users control their experience through settings:

### Secretary Aggressiveness
- **Conservative**: Only urgent items + explicit triggers
- **Moderate** (default): Daily briefing + opportunistic moments
- **Proactive**: Frequent check-ins throughout day

### Location Tracking Level
- **Off**: No location tracking
- **Minimal** (default): Only saved locations, check every 15 min
- **Moderate**: Significant location changes, background updates
- **Full**: Continuous tracking

### Notification Preferences
- Enable/disable notification types
- Quiet hours
- Do Not Disturb respect

---

## Success Metrics

1. **Engagement**: Users respond to >60% of proactive outreach
2. **Timing**: Notifications sent during productive hours +40%
3. **Completion**: Task completion rate improves 25%
4. **Satisfaction**: User mood ratings average >3.5/5
5. **Retention**: Daily active users increase 30%

---

## The Ultimate Vision

The AI secretary should feel like having a **thoughtful, attentive human assistant** who:

1. **Knows you deeply** - Your patterns, preferences, quirks
2. **Respects your autonomy** - Suggests but never demands
3. **Protects your attention** - Filters noise, surfaces signal
4. **Grows with you** - Gets better the longer you use it
5. **Celebrates your wins** - Genuine acknowledgment
6. **Has your back** - Catches problems before they happen
7. **Speaks your language** - Adapts communication style

**The goal: Users feel less anxious, more in control, and genuinely supported in achieving what matters to them.**
