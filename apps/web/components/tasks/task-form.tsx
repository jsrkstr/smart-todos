"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTaskStore } from "@/lib/store/useTaskStore"
import { TaskItem } from "./task-item"
import type { Task } from "@/types/task"
import { Drawer, DrawerContent, DrawerHeader, DrawerOverlay, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { Input } from "../ui/input"
import { Send } from "lucide-react"
import { Button } from "../ui/button"
import ChatBox from "../chat/chat-box"

interface TaskFormProps {
  taskId?: string
  isEditing?: boolean
}

export function TaskForm({ taskId, isEditing = false }: TaskFormProps) {
  const router = useRouter()
  const { tasks, updateTask } = useTaskStore()
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'dateTime' | 'tag' } | null>(null)
  const task = tasks.find(t => t.id === taskId)
  const [open, setOpen] = useState<boolean>(false)
  const snapPoints = ['148px', '355px', 1];
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  useEffect(() => {
    // setOpen(true);
  }, [])

  useEffect(() => {
    const onResize = () => {
      const height = window.innerHeight - (window.visualViewport?.height ?? 0);
      if (height > 150) { // heuristically assuming keyboard is open
        document.documentElement.style.setProperty('--screen-keyboard-height', `${height}px`);
        document.documentElement.classList.add('keyboard-open');
      } else {
        document.documentElement.style.setProperty('--screen-keyboard-height', `0px`);
        document.documentElement.classList.remove('keyboard-open');
      }
    };

    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  if (isEditing && !task) {
    return <div>Loading...</div>
  }

  const handleToggleCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      updateTask(taskId, { completed: !task.completed })
    }
  }

  const onOpenChange = (open: boolean) => {
    setOpen(open);
  };

  return task ? (
    <div className="flex flex-col justify-betweennnn h-full pb-4">
      <TaskItem
        task={task}
        onToggleCompletion={handleToggleCompletion}
        onOpenSidebar={() => { }}
        activePicker={activePicker}
        onSetActivePicker={setActivePicker}
        showDetails
      />
      <div className="flex-1 grow p-4 overflow-x-scroll">
        subtasks
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </div>
      {/* <div className="flex gap-2 mb-4 w-full px-4 mobile-input">
          <Input
            placeholder="Type a message..."
            className="flex-1 rounded-full border-gray-300 focus:border-primary focus:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10 flex items-center justify-center"
          >
            <Send className="h-5 w-5" />
          </Button>
      </div> */}
      <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
        {/* snapPoints={snapPoints} activeSnapPoint={snap} setActiveSnapPoint={setSnap} */}
        <DrawerTrigger asChild>
          <div className="flex gap-2 mb-4 pt-2">
            <div style={{}} className="w-full h-full absolute"></div>
            <Input
              placeholder="Type a message..."
              className="flex-1 rounded-full border-gray-300 focus:border-primary focus:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-10 w-10 flex items-center justify-center"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </DrawerTrigger>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="px-4">
            <DrawerTitle>Chat</DrawerTitle>
          </DrawerHeader>
          <ChatBox />
        </DrawerContent>
      </Drawer>
    </div>
  ) : null
} 