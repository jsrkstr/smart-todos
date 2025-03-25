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
          reminderTime: 'at_time',
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
    // Safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get settings:', errorMessage);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

// PUT /api/settings
export async function PUT(request: Request) {
  try {
    let updates;
    try {
      updates = await request.json();
    } catch (jsonError) {
      const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown error';
      console.error('Invalid JSON in request body:', errorMessage);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    if (!updates) {
      return NextResponse.json({ error: 'Missing settings data' }, { status: 400 });
    }
    
    // Make sure reminderTime is a valid enum value if it's being updated
    if (updates.reminderTime && typeof updates.reminderTime === 'string') {
      // Verify it's a valid enum value
      const validReminderTimes = [
        "at_time", "5_minutes", "10_minutes", "15_minutes", 
        "30_minutes", "1_hour", "2_hours", "1_day"
      ];
      
      if (!validReminderTimes.includes(updates.reminderTime)) {
        updates.reminderTime = "at_time";
      }
    }
    
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log("Updating settings with:", JSON.stringify(updates, null, 2));

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
    // Safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update settings:', errorMessage);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
} 