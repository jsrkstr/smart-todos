"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
exports.createNotificationRecord = createNotificationRecord;
const database_1 = require("./database");
/**
 * Send notification via appropriate channel(s)
 */
async function sendNotification(userId, message, intervention) {
    var _a;
    const results = [];
    // Get user with settings
    const user = await database_1.prisma.user.findUnique({
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
        const chatMessage = await createChatMessage(userId, intervention.taskId, message, intervention);
        results.push({
            success: true,
            channel: 'chat',
            messageId: chatMessage.id,
        });
    }
    catch (error) {
        console.error('Failed to create chat message:', error);
        results.push({
            success: false,
            channel: 'chat',
            error: error instanceof Error ? error.message : String(error),
        });
    }
    // 2. Send push notification if enabled and user has token
    if (((_a = user.settings) === null || _a === void 0 ? void 0 : _a.notificationsEnabled) && user.expoPushToken) {
        try {
            await sendPushNotification(user.expoPushToken, message, intervention);
            results.push({
                success: true,
                channel: 'push',
            });
        }
        catch (error) {
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
 * Create an in-app chat message
 */
async function createChatMessage(userId, taskId, message, intervention) {
    return await database_1.prisma.chatMessage.create({
        data: {
            userId,
            taskId,
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
}
/**
 * Send Expo push notification
 */
async function sendPushNotification(expoPushToken, message, intervention) {
    var _a, _b;
    // Validate Expo push token format
    if (!expoPushToken.startsWith('ExponentPushToken[')) {
        throw new Error('Invalid Expo push token format');
    }
    const EXPO_API_URL = 'https://exp.host/--/api/v2/push/send';
    // Get task title for notification
    const task = await database_1.prisma.task.findUnique({
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
            taskTitle: task === null || task === void 0 ? void 0 : task.title,
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
    if (((_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.status) === 'error') {
        throw new Error(`Expo error: ${result.data[0].message}`);
    }
    return result;
}
/**
 * Get notification title based on intervention type
 */
function getNotificationTitle(intervention) {
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
function getChannelId(intervention) {
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
async function createNotificationRecord(userId, taskId, message, intervention) {
    return await database_1.prisma.notification.create({
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
function mapInterventionToNotificationType(interventionType) {
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
