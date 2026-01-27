import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware';

// PATCH /api/notifications/:id
export const PATCH = withAuth(async (
  req: AuthenticatedApiRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const userId = req.user.id;
    const { read } = await req.json();

    if (typeof read !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid read value' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.update({
      where: {
        id: params.id,
        userId
      },
      data: { read },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
});
