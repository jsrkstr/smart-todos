import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '../prisma';
import { logService } from './logService';

interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface SendNotificationToManyParams {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  }

  /**
   * Send a push notification to a specific user
   */
  async sendPushNotification({ userId, title, body, data = {} }: SendNotificationParams): Promise<void> {
    try {
      // Get the user's Expo push token from the database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { expoPushToken: true },
      });

      if (!user?.expoPushToken) {
        logService.info(`User ${userId} has no push token registered`);
        return;
      }

      await this.sendNotifications([{
        to: user.expoPushToken,
        sound: 'default',
        title,
        body,
        data,
      }]);
    } catch (error) {
      logService.error('Error sending push notification', { error, userId });
      throw error;
    }
  }

  /**
   * Send a push notification to multiple users
   */
  async sendPushNotificationToMany({ userIds, title, body, data = {} }: SendNotificationToManyParams): Promise<void> {
    try {
      // Get all users' Expo push tokens from the database
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, expoPushToken: true },
      });

      // Filter out users without push tokens
      const validTokens = users
        .filter(user => user.expoPushToken && this.expo.isExpoPushToken(user.expoPushToken))
        .map(user => user.expoPushToken as string);

      if (validTokens.length === 0) {
        logService.info('No valid push tokens found for the specified users');
        return;
      }

      // Create messages for each token
      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      await this.sendNotifications(messages);
    } catch (error) {
      logService.error('Error sending push notifications to multiple users', { error, userIds });
      throw error;
    }
  }

  /**
   * Send notifications using Expo's push notification service
   */
  private async sendNotifications(messages: ExpoPushMessage[]): Promise<void> {
    try {
      // Chunk the messages as recommended by Expo (to handle large batches)
      const chunks = this.expo.chunkPushNotifications(messages);

      // Send each chunk of notifications
      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          
          // Process the ticket responses
          for (let ticket of ticketChunk) {
            if (ticket.status === 'error') {
              logService.error('Error sending push notification', {
                errorCode: ticket.details?.error,
                errorMessage: this.getErrorMessage(ticket.details?.error),
              });
            }
          }
        } catch (error) {
          logService.error('Error sending chunk of push notifications', { error });
        }
      }
    } catch (error) {
      logService.error('Error in sendNotifications', { error });
      throw error;
    }
  }

  /**
   * Get a human-readable error message for Expo push notification errors
   */
  private getErrorMessage(errorCode?: string): string {
    switch (errorCode) {
      case 'DeviceNotRegistered':
        return 'The device has unregistered from receiving push notifications';
      case 'InvalidCredentials':
        return 'The push notification credentials are invalid';
      case 'MessageTooBig':
        return 'The push notification message was too large';
      case 'MessageRateExceeded':
        return 'Too many messages have been sent to this device';
      default:
        return 'An unknown error occurred';
    }
  }
}

export const notificationService = new NotificationService(); 