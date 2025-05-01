import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PomodoroStatus } from '@prisma/client'
import { addMinutes, isAfter, isBefore } from 'date-fns'
import { after } from 'next/server';
import { format } from 'date-fns-tz';

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

export async function GET() {
  try {
    // Fetch all active focus pomodoros
    const activePomodoros = await prisma.pomodoro.findMany({
      where: {
        status: PomodoroStatus.active,
        type: 'focus',
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
    const now = new Date()
    
    // Process each active pomodoro
    for (const pomodoro of activePomodoros) {
      // Skip if user has no push token
      if (!pomodoro.user.expoPushToken) {
        continue
      }

      // Convert pomodoro start time to UTC
      const startTime = new Date(pomodoro.startTime)
      const durationMinutes = pomodoro.duration / 60;
      
      // Calculate notification points in UTC
      const halfTimePoint = addMinutes(startTime, durationMinutes / 2)
      const fullTimePoint = addMinutes(startTime, durationMinutes)

      const oneMinuteFromNow = addMinutes(now, 1)
      
      // Debug logs for UTC times
      console.log('Current time:', now.toISOString())
      console.log('Start time:', startTime.toISOString())
      console.log('Half point time:', halfTimePoint.toISOString())
      console.log('Full point time:', fullTimePoint.toISOString())
      console.log('Current UTC time:', format(now, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'UTC' }))
      console.log('Pomodoro start time (UTC):', format(startTime, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'UTC' }))
      console.log('Half-time point (UTC):', format(halfTimePoint, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'UTC' }))
      console.log('Full-time point (UTC):', format(fullTimePoint, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'UTC' }))
      console.log('One minute from now (UTC):', format(oneMinuteFromNow, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'UTC' }))

      // Check if half-time notification is coming up in the next minute
      if (isAfter(halfTimePoint, now) && isBefore(halfTimePoint, oneMinuteFromNow)) {
        console.log('Setting timeout for half-time notification in', Math.floor((halfTimePoint.getTime() - now.getTime()) / 1000), 'seconds')
        notifications.push({
          pomodoroId: pomodoro.id,
          userId: pomodoro.userId,
          type: 'half-time',
          status: 'sent'
        })

        after(async () => {
          await (new Promise<void>(resolve => setTimeout(async () => {
            try {
              // Prepare push notification payload
              const message = {
                to: pomodoro.user.expoPushToken,
                sound: 'default',
                title: `Pomodoro Half-time`,
                body: `You're halfway through your ${durationMinutes} minute pomodoro session!`,
                data: { pomodoroId: pomodoro.id },
              }

              // Send the push notification
              const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/push`, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Accept-Encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                  'wait-time': `${halfTimePoint.getTime() - now.getTime()}`
                },
                body: JSON.stringify(message),
              })

              if (response.ok) {
                console.log('Half-time notification sent successfully')
              } else {
                console.error('Failed to send half-time push notification:', await response.text())
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
            resolve()
          }, 0)))
        })
      }

      // Check if full-time notification is coming up in the next minute
      if (isAfter(fullTimePoint, now) && isBefore(fullTimePoint, oneMinuteFromNow)) {
        console.log('Setting timeout for full-time notification in', Math.floor((fullTimePoint.getTime() - now.getTime()) / 1000), 'seconds')
        notifications.push({
          pomodoroId: pomodoro.id,
          userId: pomodoro.userId,
          type: 'full-time',
          status: 'sent'
        })

        after(async () => {
          await (new Promise<void>(resolve => setTimeout(async () => {
            try {
              // Prepare push notification payload
              const message = {
                to: pomodoro.user.expoPushToken,
                sound: 'default',
                title: `Pomodoro Completed`,
                body: `Your ${durationMinutes} minute pomodoro session is complete!`,
                data: { pomodoroId: pomodoro.id },
              }

              // Send the push notification
              const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/push`, {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Accept-Encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                  'wait-time': `${fullTimePoint.getTime() - now.getTime()}`
                },
                body: JSON.stringify(message),
              })

              if (response.ok) {
                // Update pomodoro status to finished
                // await prisma.pomodoro.update({
                //   where: { id: pomodoro.id },
                //   data: { 
                //     status: PomodoroStatus.finished,
                //     endTime: new Date()
                //   }
                // })
                console.log('Full-time notification sent successfully')
              } else {
                console.error('Failed to send full-time push notification:', await response.text())
              }
            } catch (error) {
              console.error('Error sending full-time notification:', error)
            }
          }, 0)))
        })
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
