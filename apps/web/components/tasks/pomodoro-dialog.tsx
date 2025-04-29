"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { useEffect } from "react";

interface PomodoroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PomodoroDialog({ open, onOpenChange }: PomodoroDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[35vh]">
        <DialogDescription className="sr-only">Pomodoro Timer</DialogDescription>
        <DialogHeader>
          <DialogTitle className="sr-only">Pomodoro Timer</DialogTitle>
        </DialogHeader>
        <PomodoroTimer />
      </DialogContent>
    </Dialog>
  );
}
