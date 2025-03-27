export interface TagCategory {
  id?: string
  name: string
  type: string // e.g., "Needs", "Difficulty", "HolisticLifeGoal"
  tags?: Tag[]
}

export interface Tag {
  id?: string
  name: string
  color?: string
  category?: TagCategory
  categoryId?: string
  tasks?: string[] // Task IDs
} 