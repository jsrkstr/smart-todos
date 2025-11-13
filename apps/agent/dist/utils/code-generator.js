"use strict";
/**
 * Code Generator Utilities
 *
 * Helpers to generate TypeScript code for the MCP executeCode tool
 * Follows the "Code Execution Pattern" for complex operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnalyticsCode = generateAnalyticsCode;
exports.generateBulkPriorityUpdateCode = generateBulkPriorityUpdateCode;
exports.generateBulkSubtaskCreationCode = generateBulkSubtaskCreationCode;
exports.generateTaskPatternsAnalysisCode = generateTaskPatternsAnalysisCode;
exports.generateSmartTaskRecommendationsCode = generateSmartTaskRecommendationsCode;
exports.generateCustomCode = generateCustomCode;
/**
 * Generate code to analyze all tasks and return summary statistics
 */
function generateAnalyticsCode() {
    return `
import { getTasks } from '/servers/tasks'

const tasks = await getTasks()
const now = new Date()

const completed = tasks.filter(t => t.completed)
const pending = tasks.filter(t => !t.completed)
const overdue = pending.filter(t => t.dueDate && new Date(t.dueDate) < now)

// Group by priority
const priorityCounts = {
  high: tasks.filter(t => t.priority === 'high').length,
  medium: tasks.filter(t => t.priority === 'medium').length,
  low: tasks.filter(t => t.priority === 'low').length,
}

// Group by time ranges
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 7)

const dueToday = pending.filter(t => {
  if (!t.dueDate) return false
  const due = new Date(t.dueDate)
  return due >= today && due < tomorrow
})

const dueTomorrow = pending.filter(t => {
  if (!t.dueDate) return false
  const due = new Date(t.dueDate)
  return due >= tomorrow && due < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
})

const dueThisWeek = pending.filter(t => {
  if (!t.dueDate) return false
  const due = new Date(t.dueDate)
  return due >= today && due < nextWeek
})

// Calculate average completion time for completed tasks
const completedWithDates = completed.filter(t => t.createdAt && t.updatedAt)
const avgCompletionMs = completedWithDates.length > 0
  ? completedWithDates.reduce((sum, t) => {
      const created = new Date(t.createdAt).getTime()
      const updated = new Date(t.updatedAt).getTime()
      return sum + (updated - created)
    }, 0) / completedWithDates.length
  : 0

const avgCompletionDays = Math.round(avgCompletionMs / (1000 * 60 * 60 * 24))

return {
  total: tasks.length,
  completed: completed.length,
  pending: pending.length,
  overdue: overdue.length,
  completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
  priorityCounts,
  dueToday: dueToday.length,
  dueTomorrow: dueTomorrow.length,
  dueThisWeek: dueThisWeek.length,
  avgCompletionDays,
}
`.trim();
}
/**
 * Generate code to bulk update overdue tasks to high priority
 */
function generateBulkPriorityUpdateCode() {
    return `
import { getTasks, updateTask } from '/servers/tasks'

const tasks = await getTasks({ completed: false })
const now = new Date()
const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now)

const updated = []
for (const task of overdue) {
  if (task.priority !== 'high') {
    await updateTask(task.id, { priority: 'high' })
    updated.push(task.id)
  }
}

return {
  total: overdue.length,
  updated: updated.length,
  taskIds: updated,
}
`.trim();
}
/**
 * Generate code to create multiple subtasks from a parent task
 * @param parentId Parent task ID
 * @param subtasks Array of subtask titles
 */
function generateBulkSubtaskCreationCode(parentId, subtasks) {
    return `
import { createTask } from '/servers/tasks'

const subtasks = ${JSON.stringify(subtasks)}
const parentId = '${parentId}'

const created = []
for (const title of subtasks) {
  const task = await createTask({
    title,
    parentId,
    priority: 'medium',
  })
  created.push(task.id)
}

return {
  count: created.length,
  taskIds: created,
}
`.trim();
}
/**
 * Generate code to analyze task patterns and suggest optimizations
 */
function generateTaskPatternsAnalysisCode() {
    return `
import { getTasks } from '/servers/tasks'

const tasks = await getTasks()
const completed = tasks.filter(t => t.completed)

// Find common tags
const tagCounts = new Map()
tasks.forEach(task => {
  if (task.tags) {
    task.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  }
})

const topTags = Array.from(tagCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([tag, count]) => ({ tag, count }))

// Find tasks with many subtasks (complexity indicators)
const tasksWithSubtasks = tasks.filter(t => !t.parentId)
const subtaskCounts = tasksWithSubtasks.map(parent => {
  const subtasks = tasks.filter(t => t.parentId === parent.id)
  return {
    taskId: parent.id,
    title: parent.title,
    subtaskCount: subtasks.length,
    completedSubtasks: subtasks.filter(t => t.completed).length,
  }
}).filter(t => t.subtaskCount > 0)
  .sort((a, b) => b.subtaskCount - a.subtaskCount)
  .slice(0, 5)

// Find longest-running incomplete tasks
const now = new Date()
const longRunning = tasks
  .filter(t => !t.completed)
  .map(t => ({
    taskId: t.id,
    title: t.title,
    daysOpen: Math.floor((now.getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    priority: t.priority,
  }))
  .sort((a, b) => b.daysOpen - a.daysOpen)
  .slice(0, 5)

return {
  topTags,
  complexTasks: subtaskCounts,
  longRunningTasks: longRunning,
  insights: {
    avgTasksPerTag: topTags.length > 0 ? Math.round(topTags.reduce((s, t) => s + t.count, 0) / topTags.length) : 0,
    tasksWithSubtasks: subtaskCounts.length,
    oldestOpenTaskDays: longRunning.length > 0 ? longRunning[0].daysOpen : 0,
  }
}
`.trim();
}
/**
 * Generate code to get focused task recommendations based on user profile
 * This uses psychological profile to suggest optimal tasks
 */
function generateSmartTaskRecommendationsCode() {
    return `
import { getTasks, getUserProfile, getPsychProfile } from '/servers/users'

const [tasks, profile, psychProfile] = await Promise.all([
  getTasks({ completed: false }),
  getUserProfile(),
  getPsychProfile(),
])

const now = new Date()
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

// Score tasks based on urgency, priority, and user profile
const scoredTasks = tasks.map(task => {
  let score = 0

  // Urgency scoring
  if (task.dueDate) {
    const due = new Date(task.dueDate)
    if (due < now) {
      score += 100 // Overdue
    } else if (due < tomorrow) {
      score += 50 // Due today
    } else if (due < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      score += 25 // Due this week
    }
  }

  // Priority scoring
  if (task.priority === 'high') score += 30
  else if (task.priority === 'medium') score += 15

  // Coach-based scoring (if we have psych profile)
  if (psychProfile && psychProfile.coach) {
    // Different coaches emphasize different aspects
    const coachType = psychProfile.coach.coachType
    if (coachType === 'structured' && task.tags?.includes('planning')) score += 20
    if (coachType === 'motivational' && task.priority === 'high') score += 15
    if (coachType === 'analytical' && task.description?.length > 100) score += 10
  }

  // Prefer tasks without subtasks (atomic tasks)
  const hasSubtasks = tasks.some(t => t.parentId === task.id)
  if (!hasSubtasks) score += 10

  return {
    taskId: task.id,
    title: task.title,
    priority: task.priority,
    dueDate: task.dueDate,
    score,
  }
})

// Sort by score and return top recommendations
const recommendations = scoredTasks
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)

return {
  recommendations,
  userProfile: {
    name: profile.name,
    email: profile.email,
    coachType: psychProfile?.coach?.coachType || 'none',
  },
  summary: {
    totalPending: tasks.length,
    recommendedCount: recommendations.length,
    highestScore: recommendations[0]?.score || 0,
  }
}
`.trim();
}
/**
 * Generate code for custom operations
 * @param operation Custom TypeScript code snippet
 */
function generateCustomCode(operation) {
    return operation.trim();
}
