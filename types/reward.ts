export type RewardFrequency = "instant" | "daily" | "weekly" | "monthly"

export interface Reward {
  id: string
  title: string
  description: string
  points: number
  frequency: RewardFrequency
  claimed: boolean
  dateAdded: string
}

