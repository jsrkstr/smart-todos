import { NextResponse } from 'next/server'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { TagService } from '@/lib/services/tagService'

// GET /api/tag-categories
export const GET = async (): Promise<NextResponse> => {
  try {
    const categories = await TagService.getTagCategories()
    return NextResponse.json(categories)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to get tag categories:', errorMessage)
    return NextResponse.json({ error: 'Failed to get tag categories' }, { status: 500 })
  }
}

// POST /api/tag-categories
export const POST = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let categoryData
    try {
      const payload = await req.json()
      categoryData = {
        name: payload.name
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    if (!categoryData || !categoryData.name) {
      return NextResponse.json({ error: 'Invalid category data' }, { status: 400 })
    }

    const newCategory = await TagService.createTagCategory(categoryData)
    return NextResponse.json(newCategory)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to create tag category:', errorMessage)
    return NextResponse.json({ error: 'Failed to create tag category' }, { status: 500 })
  }
})

// PUT /api/tag-categories
export const PUT = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let categoryData
    try {
      const payload = await req.json()
      
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Missing category ID' }, { status: 400 })
      }

      categoryData = {
        id: payload.id,
        name: payload.name
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const category = await TagService.updateTagCategory(categoryData)
    return NextResponse.json(category)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to update tag category:', errorMessage)
    return NextResponse.json({ error: 'Failed to update tag category' }, { status: 500 })
  }
})

// DELETE /api/tag-categories
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
      return NextResponse.json({ error: 'Missing category ID' }, { status: 400 })
    }

    await TagService.deleteTagCategory(payload.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to delete tag category:', errorMessage)
    return NextResponse.json({ error: 'Failed to delete tag category' }, { status: 500 })
  }
}) 