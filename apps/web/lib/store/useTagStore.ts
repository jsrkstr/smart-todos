import { create } from 'zustand'
import type { Tag, TagCategory } from '@/types/task'

interface TagStore {
  tags: Tag[]
  categories: TagCategory[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchTags: (force: boolean) => Promise<void>
  addTag: (tag: Omit<Tag, "id">) => Promise<Tag | null>
  updateTag: (id: string, tag: Partial<Tag>) => Promise<Tag | null>
  deleteTag: (id: string) => Promise<void>
  addCategory: (category: Omit<TagCategory, "id">) => Promise<TagCategory | null>
  updateCategory: (id: string, category: Partial<TagCategory>) => Promise<TagCategory | null>
  deleteCategory: (id: string) => Promise<void>
  refreshTags: () => Promise<void>
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  categories: [],
  loading: false,
  error: null,

  fetchTags: async (force: boolean): Promise<void> => {
    debugger;
    // Skip if already loaded or loading
    if (!force && (get().tags.length > 0 || get().loading)) return

    set({ loading: true, error: null })
    try {
      const [tagsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/tag-categories')
      ])

      if (!tagsResponse.ok || !categoriesResponse.ok) {
        throw new Error('Failed to fetch tags or categories')
      }

      const [tagsData, categoriesData] = await Promise.all([
        tagsResponse.json(),
        categoriesResponse.json()
      ])

      set({ 
        tags: tagsData, 
        categories: categoriesData, 
        loading: false 
      })
    } catch (error) {
      console.error('Failed to fetch tags or categories:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tags', 
        loading: false 
      })
    }
  },

  addTag: async (tag: Omit<Tag, "id">): Promise<Tag | null> => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tag),
      })

      if (!response.ok) {
        throw new Error('Failed to add tag')
      }

      const newTag = await response.json()
      set(state => ({ tags: [...state.tags, newTag] }))
      return newTag
    } catch (error) {
      console.error('Failed to add tag:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to add tag' })
      return null
    }
  },

  updateTag: async (id: string, tag: Partial<Tag>): Promise<Tag | null> => {
    try {
      const response = await fetch('/api/tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...tag }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tag')
      }

      const updatedTag = await response.json()
      set(state => ({
        tags: state.tags.map(t => t.id === id ? updatedTag : t)
      }))
      return updatedTag
    } catch (error) {
      console.error('Failed to update tag:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to update tag' })
      return null
    }
  },

  deleteTag: async (id: string): Promise<void> => {
    try {
      const response = await fetch('/api/tags', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete tag')
      }

      set(state => ({
        tags: state.tags.filter(tag => tag.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete tag:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to delete tag' })
    }
  },

  addCategory: async (category: Omit<TagCategory, "id">): Promise<TagCategory | null> => {
    try {
      const response = await fetch('/api/tag-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      })

      if (!response.ok) {
        throw new Error('Failed to add category')
      }

      const newCategory = await response.json()
      set(state => ({ categories: [...state.categories, newCategory] }))
      return newCategory
    } catch (error) {
      console.error('Failed to add category:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to add category' })
      return null
    }
  },

  updateCategory: async (id: string, category: Partial<TagCategory>): Promise<TagCategory | null> => {
    try {
      const response = await fetch('/api/tag-categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...category }),
      })

      if (!response.ok) {
        throw new Error('Failed to update category')
      }

      const updatedCategory = await response.json()
      set(state => ({
        categories: state.categories.map(c => c.id === id ? updatedCategory : c)
      }))
      return updatedCategory
    } catch (error) {
      console.error('Failed to update category:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to update category' })
      return null
    }
  },

  deleteCategory: async (id: string): Promise<void> => {
    try {
      const response = await fetch('/api/tag-categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      set(state => ({
        categories: state.categories.filter(category => category.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete category:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to delete category' })
    }
  },

  refreshTags: async (): Promise<void> => {
    await get().fetchTags()
  },
})) 