"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { useEffect } from "react";

interface PomodoroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTaskId: string | null;
}

export function PomodoroDialog({ open, onOpenChange, selectedTaskId }: PomodoroDialogProps) {
  // We use a wrapper to set the selectedTaskId in PomodoroTimer after mount
  useEffect(() => {
    if (open && selectedTaskId) {
      // Set selectedTaskId in PomodoroTimer via localStorage or context if needed
      localStorage.setItem("pomodoroSelectedTaskId", selectedTaskId);
    }
    return () => {
      localStorage.removeItem("pomodoroSelectedTaskId");
    };
  }, [open, selectedTaskId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <PomodoroTimer />
      </DialogContent>
    </Dialog>
  );
}
