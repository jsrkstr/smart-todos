import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PomodoroStatus } from '@prisma/client'
import { addMinutes, isAfter, isBefore } from 'date-fns'
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
    // Fetch all active pomodoros
    const activePomodoros = await prisma.pomodoro.findMany({
      where: {
        status: PomodoroStatus.active,
      },
      include: {
        user: {
          select: {
            id: true,
            expoPushToken: true,
            name: true
          }
        },
        tasks: true // Include linked tasks for multi-task pomodoros
      }
    })

    const notifications = []
    const now = toParisTime(new Date())
    
    // Process each active pomodoro
    for (const pomodoro of activePomodoros) {
      // Skip if user has no push token
      if (!pomodoro.user.expoPushToken) {
        continue
      }

      const startTime = toParisTime(pomodoro.startTime)
      const duration = pomodoro.duration
      
      // Calculate half-time and full-time notification points
      const halfTimePoint = addMinutes(startTime, duration / 2)
      const fullTimePoint = addMinutes(startTime, duration)
      
      // Check if it's time to send a notification (within a 1-minute window)
      const oneMinuteAgo = addMinutes(now, -1)
      const oneMinuteFromNow = addMinutes(now, 1)
      
      // Check for half-time notification
      if (isAfter(halfTimePoint, oneMinuteAgo) && isBefore(halfTimePoint, oneMinuteFromNow)) {
        // Time to send half-time notification
        try {
          // Prepare push notification payload
          const message = {
            to: pomodoro.user.expoPushToken,
            sound: 'default',
            title: `Pomodoro Half-time`,
            body: `You're halfway through your ${duration} minute pomodoro session!`,
            data: { pomodoroId: pomodoro.id },
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
            notifications.push({
              pomodoroId: pomodoro.id,
              userId: pomodoro.userId,
              type: 'half-time',
              status: 'sent'
            })
          } else {
            console.error('Failed to send half-time push notification:', await response.text())
            notifications.push({
              pomodoroId: pomodoro.id,
              userId: pomodoro.userId,
              type: 'half-time',
              status: 'failed'
            })
          }
        } catch (error) {
          console.error('Error sending half-time notification:', error)
          notifications.push({
            pomodoroId: pomodoro.id,
            userId: pomodoro.userId,
            type: 'half-time',
            status: 'error',
            error: (error as Error).message
          })
        }
      }
      
      // Check for full-time notification
      if (isAfter(fullTimePoint, oneMinuteAgo) && isBefore(fullTimePoint, oneMinuteFromNow)) {
        try {
          // Prepare push notification payload
          const message = {
            to: pomodoro.user.expoPushToken,
            sound: 'default',
            title: `Pomodoro Completed`,
            body: `Your ${duration} minute pomodoro session is complete!`,
            data: { pomodoroId: pomodoro.id },
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
            // Update pomodoro status to finished
            await prisma.pomodoro.update({
              where: { id: pomodoro.id },
              data: { 
                status: PomodoroStatus.finished,
                endTime: new Date()
              }
            })
            
            // Log the pomodoro completion
            await prisma.log.create({
              data: {
                type: 'pomodoro_completed',
                userId: pomodoro.userId,
                data: {
                  pomodoroId: pomodoro.id,
                  duration: pomodoro.duration,
                  type: pomodoro.type
                }
              }
            })
            
            notifications.push({
              pomodoroId: pomodoro.id,
              userId: pomodoro.userId,
              type: 'full-time',
              status: 'sent'
            })
          } else {
            console.error('Failed to send full-time push notification:', await response.text())
            notifications.push({
              pomodoroId: pomodoro.id,
              userId: pomodoro.userId,
              type: 'full-time',
              status: 'failed'
            })
          }
        } catch (error) {
          console.error('Error sending full-time notification:', error)
          notifications.push({
            pomodoroId: pomodoro.id,
            userId: pomodoro.userId,
            type: 'full-time',
            status: 'error',
            error: (error as Error).message
          })
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      processed: activePomodoros.length,
      notifications
    })
  } catch (error) {
    console.error('Pomodoro cron error:', error)
    return NextResponse.json({ error: 'Failed to process pomodoro notifications' }, { status: 500 })
  }
}
