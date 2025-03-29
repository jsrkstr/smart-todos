import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'

// GET /api/settings
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    let userSettings = await prisma.settings.findUnique({
      where: { userId: req.user.id },
    })

    if (!userSettings) {
      userSettings = await prisma.settings.create({
        data: {
          userId: req.user.id,
          theme: 'system',
          notifications: true,
          emailNotifications: false,
          timezone: 'UTC',
          language: 'en',
          pomodoroDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          soundEnabled: true,
          notificationsEnabled: true,
          emailNotifications: false,
          defaultReminderTime: 'at_time'
        },
      })

      // Log settings creation
      await prisma.log.create({
        data: {
          type: 'settings_updated',
          userId: req.user.id,
          author: 'User'
        }
      })
    }

    return NextResponse.json({
      theme: userSettings.theme,
      notifications: userSettings.notifications, 
      emailNotifications: userSettings.emailNotifications,
      timezone: userSettings.timezone,
      language: userSettings.language,
      pomodoroDuration: userSettings.pomodoroDuration,
      shortBreakDuration: userSettings.shortBreakDuration,
      longBreakDuration: userSettings.longBreakDuration,
      soundEnabled: userSettings.soundEnabled,
      notificationsEnabled: userSettings.notificationsEnabled,
      defaultReminderTime: userSettings.defaultReminderTime
    })
  } catch (error) {
    // Safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get settings:', errorMessage);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
})

// PUT /api/settings
export const PUT = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    let updates;
    try {
      updates = await req.json();
    } catch (jsonError) {
      const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown error';
      console.error('Invalid JSON in request body:', errorMessage);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    if (!updates) {
      return NextResponse.json({ error: 'Missing settings data' }, { status: 400 });
    }

    console.log("Updating settings with:", JSON.stringify(updates, null, 2));

    const updatedSettings = await prisma.settings.update({
      where: { userId: req.user.id },
      data: updates,
    })

    // Log settings update
    await prisma.log.create({
      data: {
        type: 'settings_updated',
        userId: req.user.id,
        author: 'User'
      }
    })
    return NextResponse.json({
      theme: updatedSettings.theme,
      notifications: updatedSettings.notifications,
      emailNotifications: updatedSettings.emailNotifications,
      timezone: updatedSettings.timezone,
      language: updatedSettings.language,
      pomodoroDuration: updatedSettings.pomodoroDuration,
      shortBreakDuration: updatedSettings.shortBreakDuration,
      longBreakDuration: updatedSettings.longBreakDuration,
      soundEnabled: updatedSettings.soundEnabled,
      notificationsEnabled: updatedSettings.notificationsEnabled,
      defaultReminderTime: updatedSettings.defaultReminderTime
    })
  } catch (error) {
    // Safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update settings:', errorMessage);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}) 