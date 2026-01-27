import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware';

// GET /api/notifications
export const GET = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const userId = req.user.id;
    const { searchParams } = new URL(req.url);
    const readFilter = searchParams.get('read');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        triggered: true,
        ...(readFilter !== null && { read: readFilter === 'true' })
      },
      orderBy: { triggeredAt: 'desc' },
      take: limit,
      skip: skip,
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
});
