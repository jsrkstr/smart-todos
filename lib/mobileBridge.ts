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

export function startPomodoroTimer(duration: number): void {
  sendToMobile({
    type: 'START_POMODORO',
    duration: duration
  });
}

export function stopPomodoroTimer(): void {
  sendToMobile({
    type: 'STOP_POMODORO'
  });
} 