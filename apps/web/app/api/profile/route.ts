import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/profile
export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      principles: user.principles,
      inspirations: user.inspirations,
    })
  } catch (error) {
    console.error('Failed to get profile:', error)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

// PUT /api/profile
export async function PUT(request: Request) {
  try {
    const updates = await request.json()
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updates,
    })

    return NextResponse.json({
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio || '',
      principles: updatedUser.principles,
      inspirations: updatedUser.inspirations,
    })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

// POST /api/profile/principles
export async function POST(request: Request) {
  try {
    const { principle } = await request.json()
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        principles: [...user.principles, principle],
      },
    })

    return NextResponse.json({
      principles: updatedUser.principles,
    })
  } catch (error) {
    console.error('Failed to add principle:', error)
    return NextResponse.json({ error: 'Failed to add principle' }, { status: 500 })
  }
}

// DELETE /api/profile/principles
export async function DELETE(request: Request) {
  try {
    const { index } = await request.json()
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedPrinciples = user.principles.filter((_, i) => i !== index)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        principles: updatedPrinciples,
      },
    })

    return NextResponse.json({
      principles: updatedUser.principles,
    })
  } catch (error) {
    console.error('Failed to remove principle:', error)
    return NextResponse.json({ error: 'Failed to remove principle' }, { status: 500 })
  }
} 