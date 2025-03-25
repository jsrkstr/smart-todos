import React, { useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_FETCH_TASK = 'POMODORO_TIMER';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Define background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const timerEnd = await AsyncStorage.getItem('pomodoroEndTime');
  if (timerEnd && new Date().getTime() >= parseInt(timerEnd)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's Up!",
        body: 'Your Pomodoro session is complete',
      },
      trigger: null,
    });
    await AsyncStorage.removeItem('pomodoroEndTime');
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

  const setupBackgroundTimer = async (durationMinutes: number) => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Need notification permissions!');
      return;
    }

    const endTime = new Date().getTime() + (durationMinutes * 60 * 1000);
    await AsyncStorage.setItem('pomodoroEndTime', endTime.toString());

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', data);

      if (data.type === 'START_POMODORO') {
        await setupBackgroundTimer(data.duration);
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
        source={{ uri: 'https://9f9e-2a02-8429-91a1-4601-c189-e576-bbf3-b7f7.ngrok-free.app' }} // Change this to your production URL
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