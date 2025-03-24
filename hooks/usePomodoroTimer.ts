import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useNotifications } from "@/hooks/use-notifications";
import { startPomodoroTimer, stopPomodoroTimer, isMobileApp } from "@/lib/mobileBridge";

type TimerMode = "focus" | "shortBreak" | "longBreak";

export const usePomodoroTimer = (mode: TimerMode, isActive: boolean, timeLeft: number, pomodorosCompleted: number, setPomodorosCompleted: (count: number) => void) => {
  const { settings } = useSettings();
  const { sendNotification } = useNotifications();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const halfwayNotificationSent = useRef(false);

  useEffect(() => {
    const currentTimerConfig = {
      focus: Number.parseInt(settings.pomodoroDuration) * 60,
      shortBreak: Number.parseInt(settings.shortBreakDuration) * 60,
      longBreak: Number.parseInt(settings.longBreakDuration) * 60,
    };

    if (isActive && timeLeft > 0) {
      if (isMobileApp() && !timerRef.current) {
        startPomodoroTimer(currentTimerConfig[mode] / 60);
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === Math.floor(currentTimerConfig[mode] / 2) && !halfwayNotificationSent.current) {
            halfwayNotificationSent.current = true;

            if (settings.notificationsEnabled) {
              const minutesLeft = Math.floor(prev / 60);
              sendNotification(`${mode === "focus" ? "Pomodoro" : "Break"} Halfway Point`, {
                body: `${minutesLeft} minutes remaining in your ${mode === "focus" ? "focus session" : "break"}`,
                icon: "/favicon.ico",
              });
            }
          }

          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (isMobileApp()) {
        stopPomodoroTimer();
      }

      if (settings.notificationsEnabled) {
        if (mode === "focus") {
          sendNotification("Pomodoro Completed!", {
            body: "Great job! Time to take a break.",
            icon: "/favicon.ico",
          });
        } else {
          sendNotification("Break Completed!", {
            body: "Break time is over. Ready to focus again?",
            icon: "/favicon.ico",
          });
        }
      }

      if (mode === "focus") {
        setPomodorosCompleted((prev) => prev + 1);
        if ((pomodorosCompleted + 1) % 4 === 0) {
          setMode("longBreak");
        } else {
          setMode("shortBreak");
        }

        if (settings.soundEnabled) {
          const audio = new Audio("/notification.mp3");
          audio.play().catch((e) => console.error("Error playing sound:", e));
        }
      } else {
        setMode("focus");
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (isMobileApp() && isActive) {
        stopPomodoroTimer();
      }
    };
  }, [isActive, timeLeft, mode, pomodorosCompleted, settings, sendNotification]);
}; 