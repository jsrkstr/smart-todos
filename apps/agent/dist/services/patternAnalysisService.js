"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternAnalysisService = void 0;
exports.createPatternAnalysisService = createPatternAnalysisService;
/**
 * Pattern Analysis Service
 *
 * Analyzes historical data to learn user patterns and preferences.
 * Should be run daily or weekly to keep patterns fresh.
 */
class PatternAnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Analyze and compute behavioral patterns for a user
     */
    async computePatterns(userId) {
        console.log(`[PatternAnalysis] Computing patterns for user ${userId}`);
        // Get data from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // Gather all necessary data
        const [tasks, pomodoros, chatMessages, logs] = await Promise.all([
            this.prisma.task.findMany({
                where: {
                    userId,
                    updatedAt: { gte: thirtyDaysAgo },
                },
            }),
            this.prisma.pomodoro.findMany({
                where: {
                    userId,
                    createdAt: { gte: thirtyDaysAgo },
                },
            }),
            this.prisma.chatMessage.findMany({
                where: {
                    userId,
                    createdAt: { gte: thirtyDaysAgo },
                },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.log.findMany({
                where: {
                    userId,
                    createdAt: { gte: thirtyDaysAgo },
                },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        // Compute each pattern category
        const productivityPatterns = this.analyzeProductivityPatterns(tasks, logs);
        const taskPreferences = this.analyzeTaskPreferences(tasks);
        const communicationPatterns = this.analyzeCommunicationPatterns(chatMessages);
        const completionPatterns = this.analyzeCompletionPatterns(tasks);
        const focusPatterns = this.analyzeFocusPatterns(pomodoros);
        const energyPatterns = this.analyzeEnergyPatterns(tasks, logs);
        const taskTypePreferences = this.analyzeTaskTypePreferences(tasks);
        // Calculate confidence scores
        const confidence = this.calculateConfidence(tasks.length, pomodoros.length, chatMessages.length, logs.length);
        const patterns = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ userId, computedAt: new Date() }, productivityPatterns), taskPreferences), communicationPatterns), completionPatterns), focusPatterns), energyPatterns), taskTypePreferences), { confidence });
        // Store patterns in database
        await this.storePatterns(userId, patterns);
        console.log(`[PatternAnalysis] Patterns computed with ${confidence.overall}% confidence`);
        return patterns;
    }
    /**
     * Analyze productivity patterns
     */
    analyzeProductivityPatterns(tasks, logs) {
        // Count tasks completed by hour
        const tasksByHour = {};
        for (let i = 0; i < 24; i++) {
            tasksByHour[i] = 0;
        }
        const completedTasks = tasks.filter((t) => t.completed && t.completedAt);
        completedTasks.forEach((task) => {
            const hour = new Date(task.completedAt).getHours();
            tasksByHour[hour]++;
        });
        // Find most and least productive hours
        const hours = Object.entries(tasksByHour)
            .sort(([, a], [, b]) => b - a)
            .map(([hour]) => parseInt(hour));
        const mostProductiveHours = hours.slice(0, 3); // Top 3
        const leastProductiveHours = hours.slice(-3).reverse(); // Bottom 3
        // Count tasks by day of week
        const tasksByDayOfWeek = {};
        for (let i = 0; i < 7; i++) {
            tasksByDayOfWeek[i] = 0;
        }
        completedTasks.forEach((task) => {
            const day = new Date(task.completedAt).getDay();
            tasksByDayOfWeek[day]++;
        });
        const peakProductivityDayOfWeek = Object.entries(tasksByDayOfWeek)
            .sort(([, a], [, b]) => b - a)
            .map(([day]) => parseInt(day))[0] || 0;
        // Calculate average tasks per day
        const daysWithTasks = new Set(completedTasks.map((t) => new Date(t.completedAt).toISOString().split('T')[0])).size;
        const averageTasksCompletedPerDay = daysWithTasks > 0 ? completedTasks.length / daysWithTasks : 0;
        return {
            mostProductiveHours,
            leastProductiveHours,
            averageTasksCompletedPerDay,
            peakProductivityDayOfWeek,
        };
    }
    /**
     * Analyze task preferences
     */
    analyzeTaskPreferences(tasks) {
        const completedTasks = tasks.filter((t) => t.completed && t.completedAt);
        if (completedTasks.length === 0) {
            return {
                preferredTaskDuration: 30,
                takesBreaksRegularly: false,
                respondsBetterToUrgency: false,
            };
        }
        // Calculate preferred task duration
        const durations = completedTasks
            .filter((t) => t.estimatedDuration)
            .map((t) => t.estimatedDuration);
        const preferredTaskDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 30;
        // Check if user takes breaks (look for patterns in task completion times)
        const completionTimes = completedTasks
            .map((t) => new Date(t.completedAt).getTime())
            .sort((a, b) => a - b);
        let breakCount = 0;
        for (let i = 1; i < completionTimes.length; i++) {
            const gap = (completionTimes[i] - completionTimes[i - 1]) / (1000 * 60); // minutes
            if (gap > 60) {
                breakCount++; // 60+ minute gap likely indicates a break
            }
        }
        const takesBreaksRegularly = breakCount / completionTimes.length > 0.3;
        // Check if user responds better to urgency
        const tasksWithDeadlines = completedTasks.filter((t) => t.deadline);
        if (tasksWithDeadlines.length < 5) {
            return { preferredTaskDuration, takesBreaksRegularly, respondsBetterToUrgency: false };
        }
        const completedNearDeadline = tasksWithDeadlines.filter((t) => {
            const deadline = new Date(t.deadline).getTime();
            const completed = new Date(t.completedAt).getTime();
            const daysBeforeDeadline = (deadline - completed) / (1000 * 60 * 60 * 24);
            return daysBeforeDeadline < 1; // Completed within 1 day of deadline
        });
        const respondsBetterToUrgency = completedNearDeadline.length / tasksWithDeadlines.length > 0.4;
        return {
            preferredTaskDuration,
            takesBreaksRegularly,
            respondsBetterToUrgency,
        };
    }
    /**
     * Analyze communication patterns
     */
    analyzeCommunicationPatterns(messages) {
        const assistantMessages = messages.filter((m) => m.role === 'assistant');
        const userMessages = messages.filter((m) => m.role === 'user');
        // Find which intervention types get responses
        const respondsQuicklyTo = [];
        const messageTypeCounts = {};
        for (const msg of assistantMessages) {
            const type = msg.type || 'unknown';
            if (!messageTypeCounts[type]) {
                messageTypeCounts[type] = { sent: 0, responded: 0 };
            }
            messageTypeCounts[type].sent++;
            // Check if user responded within 1 hour
            const msgTime = new Date(msg.createdAt).getTime();
            const nextUserMsg = userMessages.find((um) => new Date(um.createdAt).getTime() > msgTime);
            if (nextUserMsg) {
                const responseTime = new Date(nextUserMsg.createdAt).getTime() - msgTime;
                if (responseTime < 60 * 60 * 1000) {
                    // 1 hour
                    messageTypeCounts[type].responded++;
                }
            }
        }
        // Find types with >50% response rate
        Object.entries(messageTypeCounts).forEach(([type, counts]) => {
            if (counts.sent >= 3 && counts.responded / counts.sent > 0.5) {
                respondsQuicklyTo.push(type);
            }
        });
        // Find hours when notifications are ignored
        const ignoresNotificationsAt = [];
        const notificationsByHour = {};
        for (let i = 0; i < 24; i++) {
            notificationsByHour[i] = { sent: 0, ignored: 0 };
        }
        for (const msg of assistantMessages) {
            const hour = new Date(msg.createdAt).getHours();
            notificationsByHour[hour].sent++;
            // Check if ignored (no response within 2 hours)
            const msgTime = new Date(msg.createdAt).getTime();
            const nextUserMsg = userMessages.find((um) => new Date(um.createdAt).getTime() > msgTime);
            if (!nextUserMsg || new Date(nextUserMsg.createdAt).getTime() - msgTime > 2 * 60 * 60 * 1000) {
                notificationsByHour[hour].ignored++;
            }
        }
        // Hours with >70% ignore rate
        Object.entries(notificationsByHour).forEach(([hour, counts]) => {
            if (counts.sent >= 3 && counts.ignored / counts.sent > 0.7) {
                ignoresNotificationsAt.push(parseInt(hour));
            }
        });
        // Determine preferred frequency
        const notificationsPerDay = assistantMessages.length / 30; // Over 30 days
        const preferredNotificationFrequency = notificationsPerDay < 2
            ? 'minimal'
            : notificationsPerDay < 5
                ? 'moderate'
                : 'frequent';
        return {
            respondsQuicklyTo,
            ignoresNotificationsAt,
            preferredNotificationFrequency,
        };
    }
    /**
     * Analyze completion patterns
     */
    analyzeCompletionPatterns(tasks) {
        const completedTasks = tasks.filter((t) => t.completed && t.completedAt && t.deadline);
        if (completedTasks.length < 5) {
            return {
                completesTasksEarly: false,
                procrastinatesThenRushes: false,
                worksInBursts: false,
                underestimatesTime: false,
                overestimatesTime: false,
                averageEstimationError: 0,
            };
        }
        // Check if completes tasks early
        const earlyCompletions = completedTasks.filter((t) => {
            const deadline = new Date(t.deadline).getTime();
            const completed = new Date(t.completedAt).getTime();
            return completed < deadline - 24 * 60 * 60 * 1000; // More than 1 day early
        });
        const completesTasksEarly = earlyCompletions.length / completedTasks.length > 0.5;
        // Check for procrastination pattern
        const lastMinuteCompletions = completedTasks.filter((t) => {
            const deadline = new Date(t.deadline).getTime();
            const completed = new Date(t.completedAt).getTime();
            const hoursBeforeDeadline = (deadline - completed) / (1000 * 60 * 60);
            return hoursBeforeDeadline < 12; // Completed within 12 hours of deadline
        });
        const procrastinatesThenRushes = lastMinuteCompletions.length / completedTasks.length > 0.4;
        // Check for burst work pattern
        const allCompletedTasks = tasks.filter((t) => t.completed && t.completedAt);
        const completionTimes = allCompletedTasks
            .map((t) => new Date(t.completedAt).getTime())
            .sort((a, b) => a - b);
        let burstCount = 0;
        let gapCount = 0;
        for (let i = 1; i < completionTimes.length; i++) {
            const gap = (completionTimes[i] - completionTimes[i - 1]) / (1000 * 60); // minutes
            if (gap < 15) {
                burstCount++; // Tasks completed within 15 minutes = burst
            }
            else if (gap > 120) {
                gapCount++; // 2+ hour gap
            }
        }
        const worksInBursts = burstCount > gapCount && burstCount > 5;
        // Analyze time estimation accuracy
        const tasksWithEstimates = completedTasks.filter((t) => t.estimatedDuration && t.createdAt);
        if (tasksWithEstimates.length < 3) {
            return {
                completesTasksEarly,
                procrastinatesThenRushes,
                worksInBursts,
                underestimatesTime: false,
                overestimatesTime: false,
                averageEstimationError: 0,
            };
        }
        const estimationErrors = tasksWithEstimates.map((t) => {
            const estimated = t.estimatedDuration;
            const actual = (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) /
                (1000 * 60);
            return ((actual - estimated) / estimated) * 100; // percentage error
        });
        const averageEstimationError = estimationErrors.reduce((a, b) => a + b, 0) / estimationErrors.length;
        const underestimatesTime = averageEstimationError > 20; // Consistently 20%+ over
        const overestimatesTime = averageEstimationError < -20; // Consistently 20%+ under
        return {
            completesTasksEarly,
            procrastinatesThenRushes,
            worksInBursts,
            underestimatesTime,
            overestimatesTime,
            averageEstimationError,
        };
    }
    /**
     * Analyze focus patterns from pomodoro data
     */
    analyzeFocusPatterns(pomodoros) {
        if (pomodoros.length < 5) {
            return {
                maxDeepWorkMinutes: 25,
                optimalSessionLength: 25,
                breakFrequencyNeeded: 30,
                distractibilityByHour: {},
            };
        }
        // Calculate max deep work duration
        const completedPomodoros = pomodoros.filter((p) => p.status === 'finished');
        const durations = completedPomodoros.map((p) => {
            const start = new Date(p.startedAt).getTime();
            const end = p.completedAt ? new Date(p.completedAt).getTime() : start + 25 * 60 * 1000;
            return (end - start) / (1000 * 60);
        });
        const maxDeepWorkMinutes = durations.length > 0 ? Math.max(...durations) : 25;
        const averageDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 25;
        const optimalSessionLength = Math.round(averageDuration);
        // Calculate average break frequency
        const pomodoroTimes = completedPomodoros
            .map((p) => new Date(p.startedAt).getTime())
            .sort((a, b) => a - b);
        const breaks = [];
        for (let i = 1; i < pomodoroTimes.length; i++) {
            const gap = (pomodoroTimes[i] - pomodoroTimes[i - 1]) / (1000 * 60);
            if (gap < 120) {
                // Reasonable break (<2 hours)
                breaks.push(gap);
            }
        }
        const breakFrequencyNeeded = breaks.length > 0
            ? Math.round(breaks.reduce((a, b) => a + b, 0) / breaks.length)
            : 30;
        // Calculate distractibility by hour (based on interrupted pomodoros)
        const distractibilityByHour = {};
        const pomodorosByHour = {};
        for (let i = 0; i < 24; i++) {
            pomodorosByHour[i] = { total: 0, interrupted: 0 };
        }
        pomodoros.forEach((p) => {
            const hour = new Date(p.startedAt).getHours();
            pomodorosByHour[hour].total++;
            if (p.status === 'interrupted') {
                pomodorosByHour[hour].interrupted++;
            }
        });
        Object.entries(pomodorosByHour).forEach(([hour, counts]) => {
            if (counts.total > 0) {
                distractibilityByHour[parseInt(hour)] = Math.round((counts.interrupted / counts.total) * 100);
            }
        });
        return {
            maxDeepWorkMinutes,
            optimalSessionLength,
            breakFrequencyNeeded,
            distractibilityByHour,
        };
    }
    /**
     * Analyze energy patterns
     */
    analyzeEnergyPatterns(tasks, logs) {
        // Energy is approximated from task completion speed and activity
        const energyByHour = {};
        const energyByDayOfWeek = {};
        // Initialize with neutral energy (50)
        for (let i = 0; i < 24; i++) {
            energyByHour[i] = 50;
        }
        for (let i = 0; i < 7; i++) {
            energyByDayOfWeek[i] = 50;
        }
        // Use task completion frequency as energy proxy
        const completedTasks = tasks.filter((t) => t.completed && t.completedAt);
        const tasksByHour = {};
        const tasksByDay = {};
        for (let i = 0; i < 24; i++)
            tasksByHour[i] = 0;
        for (let i = 0; i < 7; i++)
            tasksByDay[i] = 0;
        completedTasks.forEach((task) => {
            const hour = new Date(task.completedAt).getHours();
            const day = new Date(task.completedAt).getDay();
            tasksByHour[hour]++;
            tasksByDay[day]++;
        });
        // Normalize to 0-100 scale
        const maxTasksPerHour = Math.max(...Object.values(tasksByHour), 1);
        const maxTasksPerDay = Math.max(...Object.values(tasksByDay), 1);
        Object.keys(tasksByHour).forEach((hour) => {
            energyByHour[parseInt(hour)] = Math.round((tasksByHour[parseInt(hour)] / maxTasksPerHour) * 100);
        });
        Object.keys(tasksByDay).forEach((day) => {
            energyByDayOfWeek[parseInt(day)] = Math.round((tasksByDay[parseInt(day)] / maxTasksPerDay) * 100);
        });
        // Default values for other energy metrics
        const energyAfterMeetings = 60; // Assume moderate energy loss
        const energyAfterExercise = 80; // Assume energy boost
        return {
            energyByHour,
            energyByDayOfWeek,
            energyAfterMeetings,
            energyAfterExercise,
        };
    }
    /**
     * Analyze task type preferences
     */
    analyzeTaskTypePreferences(tasks) {
        var _a, _b;
        const completedTasks = tasks.filter((t) => t.completed && t.completedAt);
        if (completedTasks.length < 10) {
            return {
                prefersCreativeWork: 'any',
                prefersAdminWork: 'any',
                avoidsCertainTaskTypes: [],
                excellsAt: [],
            };
        }
        // Analyze by time of day and tags
        const creativeTasksByPeriod = { morning: 0, afternoon: 0, evening: 0 };
        const adminTasksByPeriod = { morning: 0, afternoon: 0, evening: 0 };
        completedTasks.forEach((task) => {
            const hour = new Date(task.completedAt).getHours();
            const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
            const tags = task.tags || [];
            const isCreative = tags.some((t) => ['design', 'creative', 'writing', 'brainstorm'].includes(t.toLowerCase()));
            const isAdmin = tags.some((t) => ['admin', 'email', 'paperwork', 'organize'].includes(t.toLowerCase()));
            if (isCreative)
                creativeTasksByPeriod[period]++;
            if (isAdmin)
                adminTasksByPeriod[period]++;
        });
        const prefersCreativeWork = ((_a = Object.entries(creativeTasksByPeriod).sort(([, a], [, b]) => b - a)[0]) === null || _a === void 0 ? void 0 : _a[0]) || 'any';
        const prefersAdminWork = ((_b = Object.entries(adminTasksByPeriod).sort(([, a], [, b]) => b - a)[0]) === null || _b === void 0 ? void 0 : _b[0]) || 'any';
        // Find avoided task types (incomplete tasks with same tags)
        const incompleteTasks = tasks.filter((t) => !t.completed);
        const tagCounts = {};
        tasks.forEach((task) => {
            const tags = task.tags || [];
            tags.forEach((tag) => {
                if (!tagCounts[tag]) {
                    tagCounts[tag] = { total: 0, incomplete: 0 };
                }
                tagCounts[tag].total++;
                if (!task.completed) {
                    tagCounts[tag].incomplete++;
                }
            });
        });
        const avoidsCertainTaskTypes = Object.entries(tagCounts)
            .filter(([, counts]) => counts.total >= 3 && counts.incomplete / counts.total > 0.7)
            .map(([tag]) => tag);
        // Find task types user excels at (completed quickly)
        const excellsAt = Object.entries(tagCounts)
            .filter(([, counts]) => counts.total >= 3 && counts.incomplete / counts.total < 0.2)
            .map(([tag]) => tag);
        return {
            prefersCreativeWork,
            prefersAdminWork,
            avoidsCertainTaskTypes,
            excellsAt,
        };
    }
    /**
     * Calculate confidence scores based on data availability
     */
    calculateConfidence(taskCount, pomodoroCount, messageCount, logCount) {
        // More data = higher confidence
        const productivityConfidence = Math.min((taskCount / 50) * 100, 100);
        const completionConfidence = Math.min((taskCount / 30) * 100, 100);
        const communicationConfidence = Math.min((messageCount / 20) * 100, 100);
        const energyConfidence = Math.min(((taskCount + pomodoroCount) / 40) * 100, 100);
        const overall = Math.round((productivityConfidence +
            completionConfidence +
            communicationConfidence +
            energyConfidence) /
            4);
        return {
            productivity: Math.round(productivityConfidence),
            completion: Math.round(completionConfidence),
            communication: Math.round(communicationConfidence),
            energy: Math.round(energyConfidence),
            overall,
        };
    }
    /**
     * Store patterns in database
     */
    async storePatterns(userId, patterns) {
        await this.prisma.userPatterns.upsert({
            where: { userId },
            create: {
                userId,
                patterns: patterns,
                computedAt: patterns.computedAt,
            },
            update: {
                patterns: patterns,
                computedAt: patterns.computedAt,
                updatedAt: new Date(),
            },
        });
    }
    /**
     * Load existing patterns from database
     */
    async loadPatterns(userId) {
        const record = await this.prisma.userPatterns.findUnique({
            where: { userId },
        });
        if (!record) {
            return null;
        }
        // Check if patterns are stale (>7 days old)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (record.computedAt < sevenDaysAgo) {
            console.log(`[PatternAnalysis] Patterns for user ${userId} are stale, recomputing...`);
            return this.computePatterns(userId);
        }
        return record.patterns;
    }
}
exports.PatternAnalysisService = PatternAnalysisService;
/**
 * Factory function to create pattern analysis service
 */
function createPatternAnalysisService(prisma) {
    return new PatternAnalysisService(prisma);
}
