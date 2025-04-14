"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TaskItem } from "./task-item"
import type { Task } from "@/types/task"
import { Drawer, DrawerContent, DrawerHeader, DrawerOverlay, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { Input } from "../ui/input"
import { Send, Wand2 } from "lucide-react"
import { Button } from "../ui/button"
import ChatBox from "../chat/chat-box"
import { useToast } from "@/hooks/use-toast"
import { useTasks } from "@/hooks/use-tasks"

interface TaskFormProps {
  taskId?: string
  isEditing?: boolean
}

export function TaskForm({ taskId, isEditing = false }: TaskFormProps) {
  const router = useRouter()
  const { tasks, updateTask, refineTask, lastQuestionAsked, respondToQuestion } = useTasks()
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'dateTime' | 'tag' } | null>(null)
  const task = tasks.find(t => t.id === taskId)
  const [openChat, setOpenChat] = useState<boolean>(false)
  const snapPoints = ['148px', '355px', 1];
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
  const [isRefining, setIsRefining] = useState(false)
  const [userResponse, setUserResponse] = useState("")
  const { toast } = useToast()

  // useEffect(() => {
  //   // If a question was asked, open the drawer
  //   if (lastQuestionAsked && lastQuestionAsked.taskId === taskId) {
  //     setOpenChat(true)
  //   }
  // }, [lastQuestionAsked, taskId])

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

  const handleRefineTask = async () => {
    if (!task?.id) return
    
    try {
      setIsRefining(true)
      const updatedTask: Task | null = await refineTask(task.id);
      
      // Check if we received a question
      if (updatedTask == null) {
        toast({ 
          title: 'AI needs more information',
          description: 'Please answer the question in the chat to continue refining the task.'
        });
        // The drawer will be opened due to the useEffect above
      } else {
        toast({ title: 'Task successfully refined!' });
      }
    } catch (error) {
      console.error('Error refining task:', error)
      toast({
        title: 'Failed to refine task',
        variant: "destructive",
      });
    } finally {
      setIsRefining(false)
    }
  }

  // const handleSubmitResponse = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!userResponse.trim() || !task?.id) return;
    
  //   try {
  //     await respondToQuestion(task.id, userResponse);
  //     setUserResponse("");
      
  //     if (!lastQuestionAsked) {
  //       // If no more questions, show success and close drawer
  //       toast({ title: 'Task successfully refined!' });
  //       setOpenChat(false);
  //     }
  //   } catch (error) {
  //     console.error('Error sending response:', error);
  //     toast({
  //       title: 'Failed to send response',
  //       variant: "destructive",
  //     });
  //   }
  // }

  const onOpenChatChange = (open: boolean) => {
    setOpenChat(open);
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
      <div className="py-4">
        <Button 
            variant="outline" 
            onClick={handleRefineTask}
            disabled={isRefining}
            title="Refine task with AI"
          >
            Refine <Wand2 className={`h-5 w-5 ${isRefining ? 'animate-pulse' : ''}`} />
        </Button>
      </div>
      <div className="flex-1 grow p-4 overflow-x-scroll">
        Subtasks here
      </div>
      <Drawer open={openChat} onOpenChange={onOpenChatChange} modal={true}>
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
          <ChatBox taskId={taskId} />
          {/* {lastQuestionAsked && lastQuestionAsked.taskId === taskId ? (
            <div className="px-4 pb-4">
              <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-medium text-amber-800">AI needs more information</p>
                <p className="text-amber-700">{lastQuestionAsked.question}</p>
              </div>
              <form onSubmit={handleSubmitResponse} className="flex gap-2">
                <Input
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="Type your answer..."
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={!userResponse.trim() || isRefining}
                >
                  Send
                </Button>
              </form>
            </div>
          ) : (
            <ChatBox taskId={taskId} />
          )} */}
        </DrawerContent>
      </Drawer>
    </div>
  ) : null
} 