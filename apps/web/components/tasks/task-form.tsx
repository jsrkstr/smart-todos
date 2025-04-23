"use client"

import { useEffect, useState, ReactNode, useRef } from "react"
import { useRouter } from "next/navigation"
import { TaskItem } from "./task-item"
import type { Task } from "@/types/task"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerOverlay, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { Input } from "../ui/input"
import { Loader2, Send, Sparkles, Wand2 } from "lucide-react"
import { Button } from "../ui/button"
import ChatBox, { ChatBoxHandle } from "../chat/chat-box"
import { useToast } from "@/hooks/use-toast"
import { useTasks } from "@/hooks/use-tasks"
import { TasksList } from "./tasks-list"
import { useChatMessages } from "@/hooks/use-chat-messages"
import type { Message } from "ai"

interface TaskFormProps {
  taskId?: string
}

export function TaskForm({ taskId }: TaskFormProps) {
  const router = useRouter()
  const {
    tasks,
    updateTask,
    refineTask,
    breakdownTask,
    lastQuestionAsked,
    respondToQuestion
  } = useTasks()
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'dateTime' | 'tag' } | null>(null)
  const task = tasks.find(t => t.id === taskId)
  const [openChat, setOpenChat] = useState<boolean>(false)
  const snapPoints = ['148px', '355px', 1];
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
  const [isRefining, setIsRefining] = useState(false)
  const [isBreakingDown, setIsBreakingDown] = useState(false)
  const [userResponse, setUserResponse] = useState("")
  const { toast } = useToast()
  const isSubtask = !!task?.parentId;
  const { loadMessages } = useChatMessages(taskId)
  const chatboxRef = useRef<ChatBoxHandle>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // useEffect(() => {
  //   // If a question was asked, open the drawer
  //   if (lastQuestionAsked && lastQuestionAsked.taskId === taskId) {
  //     setOpenChat(true)
  //   }
  // }, [lastQuestionAsked, taskId])

  useEffect(() => {
    loadMessages()
  }, []);

  if (!task) {
    return <div>Loading...</div>
  }

  const handleToggleCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      updateTask(taskId, { completed: !task.completed })
    }
  }

  const handleRefineTask = async () => {
    if (!task?.id) return

    try {
      if (!openChat) {
        setOpenChat(true)
        await (new Promise(resolve => setTimeout(resolve, 100)))
      }
      setIsRefining(true)
      await chatboxRef.current?.addMessage({
        role: 'user',
        content: 'Refine this task and update in database',
      });
    } catch (error) {
      console.error('Error refining task:', error)
      toast({
        title: 'Failed to refine task',
        variant: "destructive",
      });
      setIsRefining(false)
    } finally {
      
    }
  }

  const handleBreakdownTask = async () => {
    if (!task?.id) return

    if (!openChat) {
      setOpenChat(true)
      await (new Promise(resolve => setTimeout(resolve, 100)))
    }

    try {
      setIsBreakingDown(true)
      await chatboxRef.current?.addMessage({
        role: 'user',
        content: 'Breakdown this task and update in database',
      });
    } catch (error) {
      console.error('Error breaking down task:', error)
      toast({
        title: 'Failed to break down task',
        variant: "destructive",
      });
      setIsBreakingDown(false)
    } finally {
      
    }
  }

  const onOpenChatChange = (open: boolean) => {
    setOpenChat(open);
  };

  return task ? (
    <div className="flex flex-col h-full pb-4">
      <TaskItem
        task={task}
        onToggleCompletion={handleToggleCompletion}
        onOpenSidebar={() => { }}
        activePicker={activePicker}
        onSetActivePicker={setActivePicker}
        showDetails
      />
      <div className="py-4">
        {!isSubtask && task.stage === 'Refinement' && task.stageStatus === 'NotStarted' && (
          <Button
            variant="outline"
            onClick={handleRefineTask}
            disabled={isRefining}
            title="Refine task with AI"
          >
            {isRefining ? (
              <>
                Refining <Loader2 className="h-5 w-5 animate-spin" />
              </>
            ) : (
              <>
                Refine <Wand2 className="h-5 w-5" />
              </>
            )}
          </Button>
        )}
        {!isSubtask && task.stage === 'Refinement' && task.stageStatus === 'Completed' && (
          <Button
            variant="outline"
            onClick={handleBreakdownTask}
            disabled={isBreakingDown}
            title="Break down task with AI"
          >
            {isBreakingDown ? (
              <>
                Breaking Down <Loader2 className="h-5 w-5 animate-spin" />
              </>
            ) : (
              <>
                Breakdown <Wand2 className="h-5 w-5" />
              </>
            )}
          </Button>
        )}
      </div>
      <div className="flex-1 grow py-4 mt-4 overflow-x-scroll">
        {!isSubtask &&
          <TasksList parentId={taskId} showSidebar={true} />
        }
      </div>
      <Drawer open={openChat} onOpenChange={onOpenChatChange} modal={true} dismissible={!chatLoading}>
        <DrawerTrigger asChild>
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white z-10">
            <Button
              variant="secondary"
              className="rounded-lg h-10 px-8"
            >
              Chat with Coach
            </Button>
          </div>
        </DrawerTrigger>
        <DrawerContent className="max-h-[70vh]">
          <DrawerDescription className="sr-only">chat about task</DrawerDescription>
          <DrawerHeader className="px-4">
            <DrawerTitle>Chat</DrawerTitle>
          </DrawerHeader>
          <ChatBox
            taskId={taskId}
            ref={chatboxRef}
            onLoadingChange={(loading) => setChatLoading(loading)}
            slotContent={
              <div className="flex justify-center">
                {!isSubtask && task.stage === 'Refinement' && task.stageStatus === 'NotStarted' && !isRefining && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleRefineTask}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Refine</span>
                  </Button>
                )}
                {!isSubtask && task.stage === 'Refinement' && task.stageStatus === 'Completed' && !isBreakingDown && (
                  <Button
                    variant="outline"
                    onClick={handleBreakdownTask}
                    title="Break down task with AI"
                  >
                    Breakdown<Wand2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            } />
        </DrawerContent>
      </Drawer>
    </div>
  ) : null
} 