interface MobileBridge {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ReactNativeWebView?: MobileBridge;
  }
}

export function isMobileApp(): boolean {
  return !!window.ReactNativeWebView;
}

type MessageType = 
  | 'START_POMODORO' 
  | 'STOP_POMODORO' 
  | 'SEND_NOTIFICATION' 
  | 'UPDATE_TASKS'
  | 'AUTH_TOKEN';

interface BaseMessage {
  type: MessageType;
}

interface TaskUpdateMessage extends BaseMessage {
  type: 'UPDATE_TASKS';
  tasks: Task[];
}

interface NotificationMessage extends BaseMessage {
  type: 'SEND_NOTIFICATION';
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

interface PomodoroStartMessage extends BaseMessage {
  type: 'START_POMODORO';
  duration: number;
  mode: string;
}

interface PomodoroStopMessage extends BaseMessage {
  type: 'STOP_POMODORO';
}

interface AuthTokenMessage extends BaseMessage {
  type: 'AUTH_TOKEN';
  token: string;
}

type BridgeMessage = 
  | TaskUpdateMessage 
  | NotificationMessage 
  | PomodoroStartMessage 
  | PomodoroStopMessage
  | AuthTokenMessage;

export function sendToMobile(message: BridgeMessage): void {
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
  data?: Record<string, unknown>;
}

// Import Task type
import type { Task } from '@/types/task';

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

export function updateTasks(tasks: Task[]): void {
  sendToMobile({
    type: 'UPDATE_TASKS',
    tasks
  });
} 