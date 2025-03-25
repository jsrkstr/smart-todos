interface MobileBridge {
  postMessage: (message: any) => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: MobileBridge;
  }
}

export function isMobileApp(): boolean {
  return !!window.ReactNativeWebView;
}

export function sendToMobile(message: any): void {
  if (isMobileApp()) {
    window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  }
}

interface PomodoroTimerParams {
  duration: number;
  mode: string;
}

interface NotificationParams {
  title: string;
  body?: string;
  data?: any;
}

export function startPomodoroTimer(params: PomodoroTimerParams): void {
  sendToMobile({
    type: 'START_POMODORO',
    duration: params.duration,
    mode: params.mode
  });
}

export function stopPomodoroTimer(): void {
  sendToMobile({
    type: 'STOP_POMODORO'
  });
}

export function sendNotification(params: NotificationParams): void {
  sendToMobile({
    type: 'SEND_NOTIFICATION',
    title: params.title,
    body: params.body,
    data: params.data
  });
}

export function updateTasks(tasks: any[]): void {
  sendToMobile({
    type: 'UPDATE_TASKS',
    tasks
  });
} 