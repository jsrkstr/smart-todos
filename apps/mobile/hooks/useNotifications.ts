import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushToken } from '../app/api/notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken?: string;
  notification?: Notifications.Notification;
  isRegistered: boolean;
  isServerRegistered: boolean;
  error?: Error;
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return undefined;
    }
    
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token?.data;
}

export default function useNotifications(): PushNotificationState {
  const [pushNotificationState, setPushNotificationState] = useState<PushNotificationState>({
    isRegistered: false,
    isServerRegistered: false,
  });
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync()
      .then(async token => {
        if (token) {
          setPushNotificationState(prev => ({
            ...prev,
            expoPushToken: token,
            isRegistered: true,
          }));

          // Register token with the server
          const isRegistered = await registerPushToken(token);
          setPushNotificationState(prev => ({
            ...prev,
            isServerRegistered: isRegistered,
          }));
        }
      })
      .catch(error => {
        setPushNotificationState(prev => ({ ...prev, error }));
      });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setPushNotificationState(prev => ({ ...prev, notification }));
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification response (e.g., navigate to specific screen)
    });

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return pushNotificationState;
} 