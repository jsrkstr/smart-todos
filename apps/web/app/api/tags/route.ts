import { NextResponse } from 'next/server'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { TagService } from '@/lib/services/tagService'

// GET /api/tags
export const GET = async (): Promise<NextResponse> => {
  try {
    const tags = await TagService.getTags()
    return NextResponse.json(tags)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to get tags:', errorMessage)
    return NextResponse.json({ error: 'Failed to get tags' }, { status: 500 })
  }
}

// POST /api/tags
export const POST = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let tagData
    try {
      const payload = await req.json()
      tagData = {
        name: payload.name,
        color: payload.color || '#6366F1', // Default color if not provided
        categoryId: payload.categoryId
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    if (!tagData || !tagData.name) {
      return NextResponse.json({ error: 'Invalid tag data' }, { status: 400 })
    }

    const newTag = await TagService.createTag(tagData)
    return NextResponse.json(newTag)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to create tag:', errorMessage)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
})

// PUT /api/tags
export const PUT = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let tagData
    try {
      const payload = await req.json()
      
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Missing tag ID' }, { status: 400 })
      }

      tagData = {
        id: payload.id,
        name: payload.name,
        color: payload.color,
        categoryId: payload.categoryId
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const tag = await TagService.updateTag(tagData)
    return NextResponse.json(tag)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to update tag:', errorMessage)
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
  }
})

// DELETE /api/tags
export const DELETE = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let payload
    try {
      payload = await req.json()
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Missing tag ID' }, { status: 400 })
    }

    await TagService.deleteTag(payload.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to delete tag:', errorMessage)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}) 