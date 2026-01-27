import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware';

// POST /api/notifications/mark-all-read
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
});
