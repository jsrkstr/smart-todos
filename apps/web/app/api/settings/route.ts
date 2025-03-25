import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/settings
export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let userSettings = await prisma.settings.findUnique({
      where: { userId: user.id },
    })

    if (!userSettings) {
      userSettings = await prisma.settings.create({
        data: {
          userId: user.id,
          theme: 'system',
          pomodoroDuration: '25',
          shortBreakDuration: '5',
          longBreakDuration: '15',
          soundEnabled: true,
          notificationsEnabled: true,
          emailNotifications: false,
          reminderTime: '30',
        },
      })
    }

    return NextResponse.json({
      theme: userSettings.theme,
      pomodoroDuration: userSettings.pomodoroDuration,
      shortBreakDuration: userSettings.shortBreakDuration,
      longBreakDuration: userSettings.longBreakDuration,
      soundEnabled: userSettings.soundEnabled,
      notificationsEnabled: userSettings.notificationsEnabled,
      emailNotifications: userSettings.emailNotifications,
      reminderTime: userSettings.reminderTime,
    })
  } catch (error) {
    console.error('Failed to get settings:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

// PUT /api/settings
export async function PUT(request: Request) {
  try {
    const updates = await request.json()
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedSettings = await prisma.settings.update({
      where: { userId: user.id },
      data: updates,
    })

    return NextResponse.json({
      theme: updatedSettings.theme,
      pomodoroDuration: updatedSettings.pomodoroDuration,
      shortBreakDuration: updatedSettings.shortBreakDuration,
      longBreakDuration: updatedSettings.longBreakDuration,
      soundEnabled: updatedSettings.soundEnabled,
      notificationsEnabled: updatedSettings.notificationsEnabled,
      emailNotifications: updatedSettings.emailNotifications,
      reminderTime: updatedSettings.reminderTime,
    })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
} 