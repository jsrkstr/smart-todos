"use client"

import * as React from "react"
import { useState, useCallback, useRef } from "react"
import { useTasks } from "@/hooks/use-tasks"
import type { Task, TaskPriority } from "@/types/task"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { TaskItem, TASK_ITEM_TYPE } from "./task-item"
import { useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "../ui/skeleton"
import { cn } from "@/lib/utils"
import { Loader2, PlusSquare, Sparkles } from "lucide-react"
import { Button } from "../ui/button"
import { TaskForm } from "./task-form"
import { useDrop } from "react-dnd"
import { DndContext } from "./dnd-context"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import ChatBox, { ChatBoxHandle } from "../chat/chat-box"
import { useToast } from "@/hooks/use-toast"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { useTaskStore } from "@/lib/store"

interface TaskGroup {
  title: string;
  tasks: Task[];
  priority: TaskPriority;
  completed: boolean;
  date?: string;
}

interface TasksListProps {
  parentId?: string;
  showSidebar?: boolean;
}

// Task Group component that handles dropping tasks
function TaskGroupContainer({ group, children, onDrop }: { 
  group: TaskGroup, 
  children: React.ReactNode,
  onDrop: (itemId: string, group: TaskGroup) => void
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, dropConnector] = useDrop({
    accept: TASK_ITEM_TYPE,
    drop: (item: { taskId: string }) => {
      onDrop(item.taskId, group);
      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });
  
  // Connect the drop ref
  React.useEffect(() => {
    if (dropRef.current) {
      dropConnector(dropRef);
    }
  }, [dropConnector]);

  return (
    <div 
      ref={dropRef} 
      className={cn(
        "transition-colors duration-200",
        isOver && "bg-gray-100 rounded-md p-4 -m-4"
      )}
    >
      {children}
    </div>
  );
}

function TasksListContent({ parentId, showSidebar = true }: TasksListProps) {
  const router = useRouter()
  const searchParams = useSearchParams();
  const { initialized: storeInitialized, loading, tasks, updateTask, addTask } = useTasks()
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'dateTime' | 'tag' } | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [openChat, setOpenChat] = useState<boolean>(false)
  const [isPrioritizing, setIsPrioritizing] = useState<boolean>(false)
  const { toast } = useToast()
  const { loadMessages } = useChatMessages()
  const { fetchTasks } = useTaskStore()
  const isSubtaskList = !!parentId;
  const chatboxRef = useRef<ChatBoxHandle>(null);

  // Filter tasks based on parentId
  const filteredTasks = parentId
    ? tasks.filter(task => task.parentId === parentId)
    : tasks.filter(task => !task.parentId); // Root tasks only when no parentId

  // Group tasks by priority
  const highPriorityTasks = filteredTasks.filter(task => task.priority === "high" && !task.completed)
  const mediumPriorityTasks = filteredTasks.filter(task => task.priority === "medium" && !task.completed)
  const lowPriorityTasks = filteredTasks.filter(task => task.priority === "low" && !task.completed)
  const completedTasks = filteredTasks.filter(task => task.completed)
  const todayTasks = filteredTasks.filter(task => {
    if (!task.date) return false;
    const taskDate = new Date(task.date);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString() && !task.completed;
  });

  React.useEffect(() => {
    if (!searchParams.get('task-id') && selectedTaskId) {
      setSelectedTaskId(null);
    }
  }, [searchParams])

  // Create task groups
  const taskGroups: TaskGroup[] = [
    ...(isSubtaskList ? [
      {
        title: "Sub Tasks",
        tasks: filteredTasks,
        priority: 'medium' as TaskPriority,
        completed: false,
      }
    ] :
    [
      {
        title: "Today",
        tasks: todayTasks,
        priority: 'high' as TaskPriority,
        completed: false,
        date: (new Date()).toISOString(),
      },
      {
        title: "High Priority",
        tasks: highPriorityTasks,
        priority: 'high' as TaskPriority,
        completed: false,
      },
      {
        title: "Medium Priority",
        tasks: mediumPriorityTasks,
        priority: 'medium' as TaskPriority,
        completed: false,
      },
      {
        title: "Low Priority",
        tasks: lowPriorityTasks,
        priority: 'low' as TaskPriority,
        completed: false,
      },
      {
        title: "Completed",
        tasks: completedTasks,
        priority: 'high' as TaskPriority,
        completed: true,
      },
    ])
  ]

  const toggleTaskCompletion = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      updateTask(taskId, { completed: !task.completed })
    }
  }

  const handleDropTask = useCallback((taskId: string, targetGroup: TaskGroup) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates: Partial<Task> = {
      priority: targetGroup.priority
    };

    // If dropping into today group, update the date
    if (targetGroup.title === "Today" && targetGroup.date) {
      const taskDate = task.date ? new Date(task.date) : new Date(targetGroup.date);
      const todayDate = new Date(targetGroup.date);
      
      // Preserve the time from existing task date, but use today's date
      if (task.date) {
        taskDate.setFullYear(todayDate.getFullYear());
        taskDate.setMonth(todayDate.getMonth());
        taskDate.setDate(todayDate.getDate());
      }
      
      updates.date = taskDate.toISOString();
    }

    // If dropping into completed group, mark as completed
    if (targetGroup.completed && !task.completed) {
      updates.completed = true;
    } else if (!targetGroup.completed && task.completed) {
      // If dropping from completed to non-completed, mark as not completed
      updates.completed = false;
    }

    updateTask(taskId, updates);
  }, [tasks, updateTask]);

  const addNewTask = async (group: TaskGroup) => {
    const newTask = await addTask({
      title: '',
      priority: group.priority,
      completed: group.completed,
      parentId: parentId, // Set parentId if provided
      ...(group.date ? {
        date: group.date
      }: {}),
      notifications: [{
        mode: 'Push',
        type: 'Reminder',
        trigger: 'RelativeTime',
        relativeTimeValue: 15,
        relativeTimeUnit: 'Minutes',
        author: 'Bot',
      }, {
        mode: 'Push',
        type: 'Reminder',
        trigger: 'RelativeTime',
        relativeTimeValue: 30,
        relativeTimeUnit: 'Minutes',
        author: 'Bot',
      }],
    });
    if (newTask) {
      setEditingTaskId(newTask.id);
    }
  }

  const onOpenTaskDetails = (id: string) => {
    if (!showSidebar) return;
    router.push(`?task-id=${id}`);
    setSelectedTaskId(id);
  }

  const onOpenChange = (open: boolean) => {
    if (!open && searchParams.get('task-id')) {
      router.back();
    }
    setSelectedTaskId(open ? selectedTaskId : null);
  }

  const onOpenChatChange = (open: boolean) => {
    setOpenChat(open);
  };

  const handlePrioritizeTasks = async () => {
    try {
      setIsPrioritizing(true);
      console.log('start send message')
      await chatboxRef.current?.addMessage({
        role: 'user',
        content: 'Prioritize my tasks',
      });
      console.log('end send message')
      
      // Refresh tasks
      await fetchTasks(true);
      
      toast({
        title: 'Tasks prioritized successfully',
        description: 'Your tasks have been reorganized by priority',
      });
    } catch (error) {
      console.error('Error prioritizing tasks:', error);
      toast({
        title: 'Failed to prioritize tasks',
        variant: 'destructive',
      });
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Priority Task button to inject into ChatBox
  const prioritizeButton = (
    <div className="flex justify-center">
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
        disabled={isPrioritizing}
        onClick={handlePrioritizeTasks}
      >
        {!isPrioritizing && (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Prioritize My Tasks</span>
          </>
        )}
      </Button>
    </div>
  );

  // Don't show groups with no tasks
  const visibleTaskGroups = taskGroups;//.filter(group => group.tasks.length > 0);

  return (
    <div>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {storeInitialized && !loading ?
          visibleTaskGroups.length > 0 ? (
            visibleTaskGroups.map((group) => (
              <TaskGroupContainer 
                key={group.title} 
                group={group}
                onDrop={handleDropTask}
              >
                <div className="">
                  <div className={cn('flex justify-between', group.tasks.length ? 'mb-3' : 'mb-2')}>
                    <h4 className={cn('text-l', !isSubtaskList && 'font-bold')}>
                      {group.title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 items-baseline"
                      onClick={() => addNewTask(group)}>
                      <PlusSquare className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleCompletion={toggleTaskCompletion}
                        onOpenSidebar={(id) => onOpenTaskDetails(id)}
                        activePicker={activePicker}
                        onSetActivePicker={setActivePicker}
                        edit={editingTaskId === task.id}
                      />
                    ))}
                  </div>
                  <div className="extra-space text-gray-400 mt-2 hidden h-2" onClick={() => addNewTask(group)}>
                    +
                  </div>
                </div>
              </TaskGroupContainer>
            ))
          ) : (
            <div className="text-center text-gray-500 my-4">
              No tasks found
            </div>
          )
          :
          <div>
            <Skeleton className="h-10 w-[200px] mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-10 w-[200px] mb-8 mt-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
            <Skeleton className="h-7 w-full mb-8" />
          </div>
        }
      </div>

      {/* Chat with Coach Drawer - only show when no task is selected */}
      {!isSubtaskList && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white z-10">
          <Drawer open={openChat} onOpenChange={onOpenChatChange} modal={true}>
            <DrawerTrigger asChild>
              <Button
                variant="secondary"
                className="rounded-lg h-10 px-8"
              >
                Chat with Coach
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[70vh]">
              <DrawerDescription className="sr-only">chat with coach</DrawerDescription>
              <DrawerHeader className="px-4">
                <DrawerTitle>Chat</DrawerTitle>
              </DrawerHeader>
              <ChatBox ref={chatboxRef} slotContent={prioritizeButton} />
            </DrawerContent>
          </Drawer>
        </div>
      )}

      <Sheet open={!!selectedTaskId} onOpenChange={(open) => onOpenChange(open)}>
        <SheetContent side="right" className="w-[100%] sm:w-[600px]">
          <SheetHeader className="h-4">
            <SheetTitle id="task-details-title" className="sr-only">Task Details</SheetTitle>
            <SheetDescription className="sr-only">
              Detailed view and editing options for the selected task.
            </SheetDescription>
          </SheetHeader>
          {selectedTaskId && <TaskForm taskId={selectedTaskId} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function TasksList(props: TasksListProps) {
  return (
    <DndContext>
      <TasksListContent {...props} />
    </DndContext>
  )
}

