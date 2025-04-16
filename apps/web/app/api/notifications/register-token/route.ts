import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LogService } from '@/lib/services/logService';
import { getToken } from 'next-auth/jwt';
import { LogAuthor, LogType, Prisma } from '@prisma/client';
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware';

// POST /api/notifications/register-token
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id;
    const { expoPushToken } = await req.json();

    if (!expoPushToken) {
      return NextResponse.json(
        { error: 'Missing expoPushToken in request body' },
        { status: 400 }
      );
    }

    console.log('token received', expoPushToken);

    // Update the user with the new Expo push token
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        expoPushToken
      },
      select: { 
        id: true, 
        name: true
      },
    });

    await LogService.createLog({
      type: LogType.settings_updated,
      userId,
      data: { action: 'registerPushToken' },
      author: LogAuthor.App
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { error: 'Failed to register push token' },
      { status: 500 }
    );
  }
})
