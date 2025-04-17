import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificationMode, NotificationTrigger } from '@prisma/client'
import { RRule, RRuleSet, rrulestr } from 'rrule'
import { addMinutes, addHours, addDays, isAfter, isBefore, parseISO, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIMEZONE = 'Europe/Paris'

// Helper function to convert UTC to Paris time
const toParisTime = (date: Date) => toZonedTime(date, TIMEZONE)

// Helper function to convert Paris time to UTC
const toUTC = (date: Date) => {
  const parisDate = toZonedTime(date, TIMEZONE)
  return new Date(parisDate.getTime() - (parisDate.getTimezoneOffset() * 60000))
}

export async function GET() {
  try {
    // Fetch all tasks with their notifications
    const tasks = await prisma.task.findMany({
      where: {
        completed: false
      },
      include: {
        notifications: {
          where: {
            mode: NotificationMode.Push,
            trigger: NotificationTrigger.RelativeTime,
            read: false
          }
        },
        user: {
          select: {
            id: true,
            expoPushToken: true,
            name: true
          }
        }
      }
    })

    // Group tasks by userId
    const tasksByUser = tasks.reduce((acc, task) => {
      const userId = task.userId
      if (!acc[userId]) {
        acc[userId] = []
      }
      acc[userId].push(task)
      return acc
    }, {} as Record<string, typeof tasks>)

    const notifications = []

    // Iterate through each user's tasks
    for (const userId in tasksByUser) {
      const userTasks = tasksByUser[userId]
      
      for (const task of userTasks) {
        // Skip if task has no notifications or user has no push token
        if (!task.notifications.length || !task.user.expoPushToken || !task.deadline) {
          continue
        }

        const taskDate = task.deadline
        const taskTime = task.time

        // Process recurrence rules if task repeats
        let isTaskDueToday = false
        if (task.repeats) {
          try {
            // Parse RRULE string
            const rruleObj = rrulestr(task.repeats)
            const now = toParisTime(new Date())
            
            // Check if the task occurs today based on recurrence rule
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            const occurrences = rruleObj.between(today, tomorrow)
            isTaskDueToday = occurrences.length > 0
          } catch (error) {
            console.error('Error parsing RRULE:', error)
          }
        } else {
          // For non-recurring tasks, check if it's scheduled for today
          const taskDateTime = toParisTime(taskDate)
          const today = toParisTime(new Date())
          isTaskDueToday = 
            taskDateTime.getDate() === today.getDate() && 
            taskDateTime.getMonth() === today.getMonth() && 
            taskDateTime.getFullYear() === today.getFullYear()
        }

        if (!isTaskDueToday) {
          continue
        }

        // Process each notification for the task
        for (const notification of task.notifications) {
          if (!notification.relativeTimeValue || !notification.relativeTimeUnit) {
            continue
          }

          const now = toParisTime(new Date())
          // since task is due today, we take today's date
          let taskDateTime = toParisTime(new Date())
          
          // Add time component if available
          if (taskTime) {
            const [hours, minutes] = taskTime.split(':').map(num => parseInt(num, 10))
            taskDateTime.setHours(hours, minutes, 0, 0)
          } else {
            // default to 10 am
            taskDateTime.setHours(10, 0, 0, 0)
          }

          // Calculate notification time based on relative settings
          let notificationTime: Date
          switch (notification.relativeTimeUnit) {
            case 'Minutes':
              notificationTime = addMinutes(taskDateTime, -notification.relativeTimeValue)
              break
            case 'Hours':
              notificationTime = addHours(taskDateTime, -notification.relativeTimeValue)
              break
            case 'Days':
              notificationTime = addDays(taskDateTime, -notification.relativeTimeValue)
              break
            default:
              continue
          }

          // Check if it's time to send the notification (within a 1-minute window)
          const oneMinuteAgo = addMinutes(now, -1)
          const oneMinuteFromNow = addMinutes(now, 1)
          
          if (isAfter(notificationTime, oneMinuteAgo) && isBefore(notificationTime, oneMinuteFromNow)) {
            // Time to send notification
            try {
              // Prepare push notification payload
              const message = {
                to: task.user.expoPushToken,
                sound: 'default',
                title: `Task reminder: ${task.title}`,
                body: `Your task is due ${notification.relativeTimeValue} ${notification.relativeTimeUnit.toLowerCase()} from now`,
                data: { taskId: task.id },
              }

              // Send the push notification
              const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Accept-Encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
              })

              if (response.ok) {
                // Mark notification as read (sent)
                // await prisma.notification.update({
                //   where: { id: notification.id },
                //   data: { read: true }
                // })
                
                notifications.push({
                  taskId: task.id,
                  userId: userId,
                  notificationId: notification.id,
                  status: 'sent'
                })
              } else {
                console.error('Failed to send push notification:', await response.text())
                notifications.push({
                  taskId: task.id,
                  userId: userId,
                  notificationId: notification.id,
                  status: 'failed'
                })
              }
            } catch (error) {
              console.error('Error sending notification:', error)
              notifications.push({
                taskId: task.id,
                userId: userId,
                notificationId: notification.id,
                status: 'error',
                error: (error as Error).message
              })
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      processed: tasks.length,
      notifications
    })
  } catch (error) {
    console.error('Notification cron error:', error)
    return NextResponse.json({ error: 'Failed to process notifications' }, { status: 500 })
  }
}