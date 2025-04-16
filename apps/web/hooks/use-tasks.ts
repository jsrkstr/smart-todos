"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { useTaskStore } from "@/lib/store/useTaskStore"
import type { Task, Notification } from "@/types/task"
import { useTagStore } from "@/lib/store/useTagStore"

export function useTasks() {
  const { scheduleTaskReminder } = useNotifications()
  const [lastQuestionAsked, setLastQuestionAsked] = useState<{
    taskId: string;
    question: string;
    understandPercentage: number;
  } | null>(null);
  
  const {
    loading,
    initialized,
    tasks, 
    setNotificationHandler,
    addTask: storeAddTask, 
    deleteTask, 
    updateTask: storeUpdateTask,
    refineTask: storeRefineTask,
    breakdownTask: storeBreakdownTask,
  } = useTaskStore()

  const { fetchTags } = useTagStore()
  const { fetchTasks } = useTaskStore()
  
  // Use a ref to track if we've already set up the notification handler
  const handlerSetupRef = useRef<boolean>(false)
  
  // Create a memoized notification setup function
  const setupNotifications = useCallback((tasks: Task[]): void => {
    tasks.forEach((task: Task) => {
      if (!task.completed) {
        scheduleTaskReminder(task)
      }
    })
  }, [scheduleTaskReminder])
  
  // Set up notification handler only once
  useEffect((): void => {
    if (!handlerSetupRef.current) {
      handlerSetupRef.current = true
      setNotificationHandler(setupNotifications)
    }
  }, [setNotificationHandler, setupNotifications]);

  // Get completed tasks
  const completedTasks: Task[] = tasks.filter((task: Task) => task.completed)

  // Add a new task with notification scheduling
  const addTask = async (task: Partial<Task>): Promise<Task | null> => {
    // Prepare notifications if specified
    if (task.notifications) {
      // Ensure each notification has proper structure
      task.notifications = task.notifications.map(notification => ({
        ...notification,
        message: notification.message || `Reminder for: ${task.title}`,
      }))
    }
    
    const newTask: Task | null = await storeAddTask(task)
    if (newTask) {
      scheduleTaskReminder(newTask)
    }
    return newTask
  }

  // Update a task with notification rescheduling
  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    // Format children properly if needed
    if (updates.children) {
      // taskStore will handle the children format conversion
    }

    // Format notifications properly if needed
    if (updates.notifications) {
      // Ensure each notification has proper structure
      updates.notifications = updates.notifications.map(notification => ({
        ...notification,
        message: notification.message || `Reminder for task`,
      }))
    }

    const updatedTask: Task | null = await storeUpdateTask(taskId, updates)
    if (updatedTask && !updatedTask.completed) {
      scheduleTaskReminder(updatedTask)
    }
    return updatedTask
  }

  const refineTask = async (taskId: string): Promise<Task | null> => {
    try {
      // Reset the last question state when starting a new refine operation
      setLastQuestionAsked(null);
      
      const updatedTask: Task | null = await storeRefineTask(taskId);
      
      // If the task is null, check if it was due to a question
      if (!updatedTask) {
        // Try to fetch the task details to see if we have a task
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // const { messages: chatMessages, loading: messagesLoading, loadMessages } = useChatMessages(taskId)
          // Try to fetch the latest message for this task to see if it's a question
          // try {
          //   const response = await fetch(`/api/chat-messages?taskId=${taskId}&latest=true`);
          //   if (response.ok) {
          //     const messages = await response.json();
          //     const latestMessage = messages[0];
              
          //     if (latestMessage && latestMessage.metadata?.type === "question") {
          //       // Set the last question asked
          //       setLastQuestionAsked({
          //         taskId,
          //         question: latestMessage.content,
          //         understandPercentage: latestMessage.metadata?.understand_percentage || 0
          //       });
          //     }
          //   }
          // } catch (error) {
          //   console.error("Error fetching chat messages:", error);
          // }
        }
      }

      if (updatedTask) {
        await fetchTags(true);
      }

      return updatedTask;
    } catch (error) {
      console.error("Error in refineTask:", error);
      return null;
    }
  }
  
  const respondToQuestion = async (taskId: string, response: string): Promise<void> => {
    try {
      // First save the user's response as a chat message
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId,
          content: response,
          role: "user"
        })
      });
      
      // Then try refining the task again with the new context
      await refineTask(taskId);
    } catch (error) {
      console.error("Error responding to question:", error);
    }
  }

  // Function to initiate task breakdown
  const breakdownTask = async (taskId: string): Promise<Task | null> => {
    try {
      // Reset question state if needed, similar to refine
      setLastQuestionAsked(null);
      
      const updatedTask: Task | null = await storeBreakdownTask(taskId);
      
      // If null, check if it was due to a question (similar logic to refineTask)
      if (!updatedTask) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // Potentially check latest chat message here if needed
          // For now, rely on the store/API to update task status to QuestionAsked
          // and the UI to react accordingly.
        }
      }
      
      // // If task updated (sub-tasks added), the store handles the state update.
      // // No need to call fetchTags here unless breakdown modifies tags (currently it doesn't).
      fetchTasks(true);
      fetchTags(true);
      
      return updatedTask;
    } catch (error) {
      console.error("Error in useTasks breakdownTask:", error);
      // Error state is handled within the store
      return null;
    }
  };

  return {
    loading,
    initialized,
    tasks,
    completedTasks,
    addTask,
    deleteTask,
    updateTask,
    refineTask,
    lastQuestionAsked,
    respondToQuestion,
    breakdownTask,
  }
}

