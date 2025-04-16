import React, { useState, useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeAuthToken } from '../api/auth';

const BACKGROUND_FETCH_TASK = 'POMODORO_TIMER';
const TASK_NOTIFICATION_TASK = 'TASK_NOTIFICATIONS';
const webviewUri = 'https://fd5f-2a02-8429-91a1-4601-ec6b-6113-8a6e-f425.ngrok-free.app';// 'https://smart-todos-web.vercel.app';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Define background task for pomodoro timer
// ... existing code ...
TaskManager.defineTask(TASK_NOTIFICATION_TASK, async () => {
  const tasks = JSON.parse(await AsyncStorage.getItem('tasks') || '[]');
  const now = new Date().getTime();

  for (const task of tasks) {
    if (task.status === "completed") continue;

    // Assuming task.date is a date string and task.time is a time string
    const taskDateTime = new Date(`${task.date}T${task.time}`).getTime();
    const reminderTimeInMs = (task.reminderTime || 0) * 60 * 1000; // Convert minutes to milliseconds

    // Calculate the notification time
    const notificationTime = taskDateTime - reminderTimeInMs;

    if (notificationTime && now >= notificationTime) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${task.title}`,
          body: `This task is scheduled for ${new Date(taskDateTime).toLocaleString()}`,
          sound: true,
          badge: 1,
        },
        trigger: null,
      });
    }
  }
  return BackgroundFetch.Result.NewData;
});

// Define background task for task notifications
TaskManager.defineTask(TASK_NOTIFICATION_TASK, async () => {
  const tasks = JSON.parse(await AsyncStorage.getItem('tasks') || '[]');
  const now = new Date().getTime();

  for (const task of tasks) {
    if (task.status === "completed") continue;

    const taskDate = new Date(task.date).getTime();
    const reminderTime = task.reminderTime ? new Date(task.reminderTime).getTime() : null;

    if (reminderTime && now >= reminderTime) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${task.title}`,
          body: `This task is scheduled for ${new Date(task.date).toLocaleString()}`,
          sound: true,
          badge: 1,
        },
        trigger: null,
      });
    }
  }
  return BackgroundFetch.Result.NewData;
});

async function triggerNotificationWithButton(notificationText: string, buttonText: string, callback: () => void) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Need notification permissions!');
    return;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: notificationText,
      body: '',
      data: { callbackId: 'buttonCallback' },
      actions: [
        {
          identifier: 'buttonAction',
          buttonTitle: buttonText,
          options: { opensAppToForeground: true },
        },
      ],
    },
    trigger: null,
  });

  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    if (response.actionIdentifier === 'buttonAction' && response.notification.request.identifier === notificationId) {
      callback();
    }
  });

  return () => {
    subscription.remove();
  };
}

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const setupBackgroundTimer = async (durationMinutes: number, mode: string) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Need notification permissions!');
      return;
    }

    const endTime = new Date().getTime() + (durationMinutes * 60 * 1000);
    await AsyncStorage.setItem('pomodoroEndTime', endTime.toString());
    await AsyncStorage.setItem('pomodoroMode', mode);

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  };

  const setupTaskNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Need notification permissions!');
      return;
    }

    await BackgroundFetch.registerTaskAsync(TASK_NOTIFICATION_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  };

  useEffect(() => {
    setupTaskNotifications();
  }, []);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', data);

      if (data.type === 'START_POMODORO') {
        await setupBackgroundTimer(data.duration, data.mode);
      } else if (data.type === 'STOP_POMODORO') {
        await AsyncStorage.removeItem('pomodoroEndTime');
        await AsyncStorage.removeItem('pomodoroMode');
      } else if (data.type === 'UPDATE_TASKS') {
        await AsyncStorage.setItem('tasks', JSON.stringify(data.tasks));
      } else if (data.type === 'AUTH_TOKEN') {
        storeAuthToken(data.token)
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <ActivityIndicator 
          style={styles.loader}
          size="large" 
          color="#0000ff" 
        />
      )}
      {/* <Text>hello</Text> */}
      <WebView
        ref={webViewRef}
        source={{ uri: webviewUri }} // Change this to your production URL
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        injectedJavaScript={`
          console = {
            log: (...args) => window.ReactNativeWebView.postMessage(JSON.stringify({type: 'log', data: args})),
            error: (...args) => window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', data: args}))
          };
        `}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    marginTop: 50,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
}); 