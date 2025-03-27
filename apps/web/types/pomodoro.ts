export type PomodoroType = "focus" | "short_break" | "long_break";
export type PomodoroStatus = "active" | "finished" | "cancelled";

export interface Pomodoro {
  id?: string
  type: PomodoroType
  taskId?: string
  status: PomodoroStatus
  startTime: string
  endTime?: string
} 