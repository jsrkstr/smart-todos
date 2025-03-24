"use client"

import { useState, useEffect } from "react"
import type { Task } from "@/types/task"

// Sample initial tasks
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Complete project proposal",
    deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    dateAdded: new Date().toISOString(),
    completed: false,
    priority: "high",
    location: "Office",
    why: "This will help advance my career and demonstrate my skills",
    subTasks: [
      { title: "Research competitors", completed: true },
      { title: "Create outline", completed: true },
      { title: "Write first draft", completed: false },
      { title: "Review with team", completed: false },
    ],
  },
  {
    id: "2",
    title: "Go for a 30-minute run",
    deadline: new Date().toISOString(), // Today
    dateAdded: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    completed: false,
    priority: "medium",
    location: "Park",
    why: "Maintaining my health is essential for long-term productivity",
    subTasks: [
      { title: "Prepare running clothes", completed: true },
      { title: "Fill water bottle", completed: false },
    ],
  },
  {
    id: "3",
    title: "Read 20 pages of book",
    deadline: new Date().toISOString(), // Today
    dateAdded: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    completed: true,
    priority: "low",
    why: "Reading helps me learn and grow",
  },
]

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem("smartTodos-tasks")
      return savedTasks ? JSON.parse(savedTasks) : initialTasks
    }
    return initialTasks
  })

  // Save to localStorage whenever tasks change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smartTodos-tasks", JSON.stringify(tasks))
    }
  }, [tasks])

  // Get completed tasks
  const completedTasks = tasks.filter((task) => task.completed)

  // Add a new task
  const addTask = (task: Task) => {
    setTasks((prev) => [task, ...prev])
  }

  // Toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  // Delete a task
  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  // Update a task
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)))
  }

  return {
    tasks,
    completedTasks,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    updateTask,
  }
}

