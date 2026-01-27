import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationTrigger } from '@prisma/client';
import { addMinutes, addHours, addDays, isBefore, isAfter } from 'date-fns';

export async function POST(req: Request) {
  try {
    const now = new Date();
    const oneMinuteAgo = addMinutes(now, -1);
    const oneMinuteFromNow = addMinutes(now, 1);

    // 1. Process FixedTime triggers
    const fixedTimeNotifications = await prisma.notification.findMany({
      where: {
        triggered: false,
        trigger: NotificationTrigger.FixedTime,
        fixedTime: { lte: now },
      },
      include: {
        user: { select: { id: true, expoPushToken: true } }
      }
    });

    for (const notification of fixedTimeNotifications) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          triggered: true,
          triggeredAt: now,
        },
      });

      // Send push notification if applicable
      if (notification.mode === 'Push' && notification.user.expoPushToken) {
        await sendPushNotification(notification, notification.user.expoPushToken);
      }
    }

    // 2. Process RelativeTime triggers
    const relativeTimeNotifications = await prisma.notification.findMany({
      where: {
        triggered: false,
        trigger: NotificationTrigger.RelativeTime,
        relativeTimeValue: { not: null },
        relativeTimeUnit: { not: null },
        taskId: { not: null },
      },
      include: {
        task: { select: { date: true, deadline: true } },
        user: { select: { id: true, expoPushToken: true } }
      },
    });

    for (const notification of relativeTimeNotifications) {
      const taskDateTime = notification.task?.date || notification.task?.deadline;
      if (!taskDateTime) continue;

      // Calculate trigger time based on relative time settings
      const triggerTime = calculateRelativeTriggerTime(
        taskDateTime,
        notification.relativeTimeValue!,
        notification.relativeTimeUnit!
      );

      // Check if trigger time has passed (within 1-minute window for cron timing)
      if ((isBefore(triggerTime, now) || triggerTime.getTime() === now.getTime()) &&
          isAfter(triggerTime, oneMinuteAgo)) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            triggered: true,
            triggeredAt: now,
          },
        });

        // Send push notification if applicable
        if (notification.mode === 'Push' && notification.user.expoPushToken) {
          await sendPushNotification(notification, notification.user.expoPushToken);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        fixedTime: fixedTimeNotifications.length,
        relativeTime: relativeTimeNotifications.length,
      },
    });
  } catch (error) {
    console.error('Error processing notification triggers:', error);
    return NextResponse.json(
      { error: 'Failed to process triggers' },
      { status: 500 }
    );
  }
}

function calculateRelativeTriggerTime(
  baseTime: Date,
  value: number,
  unit: string
): Date {
  const amount = -Math.abs(value); // Negative to go back in time

  switch (unit) {
    case 'Minutes':
      return addMinutes(baseTime, amount);
    case 'Hours':
      return addHours(baseTime, amount);
    case 'Days':
      return addDays(baseTime, amount);
    default:
      return baseTime;
  }
}

async function sendPushNotification(notification: any, expoPushToken: string) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title: 'SmartTodos',
        body: notification.message,
        data: {
          notificationId: notification.id,
          taskId: notification.taskId,
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
