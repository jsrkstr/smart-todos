export type PomodoroType = "focus" | "short_break" | "long_break";
export type PomodoroStatus = "active" | "finished" | "cancelled";

import { Task } from './task';

export interface Pomodoro {
  id?: string;
  type: PomodoroType;
  status: PomodoroStatus;
  startTime: string;
  endTime?: string;
  taskMode?: PomodoroTaskMode;
  settings?: any;
  userId: string;
  createdAt?: string;
  tasks?: Task[];
  duration: number;
}

export type PomodoroType = "focus" | "shortBreak" | "longBreak";
export type PomodoroStatus = "active" | "finished" | "cancelled" | "paused" | "resumed";
export type PomodoroTaskMode = "single" | "multi" | "free"; 