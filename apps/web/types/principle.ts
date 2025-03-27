export interface PrincipleSource {
  id?: string
  name: string
  description?: string
  type: string // e.g., "book", "famous personality"
  principles?: Principle[]
}

export interface Principle {
  id?: string
  content: string
  strategyType: string // e.g., "breakdown", "prioritisation", "motivation"
  sourceId: string
  source?: PrincipleSource
} 