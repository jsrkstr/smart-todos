"use client"

import { useState } from "react"
import { Gift, Plus, Star, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRewards } from "@/hooks/use-rewards"

export function RewardsCenter() {
  const { rewards, addReward, claimReward } = useRewards()
  const [newReward, setNewReward] = useState({
    title: "",
    description: "",
    frequency: "daily",
    points: 100,
  })

  const handleAddReward = () => {
    if (newReward.title.trim()) {
      addReward({
        id: Date.now().toString(),
        ...newReward,
        claimed: false,
        dateAdded: new Date().toISOString(),
      })

      // Reset form
      setNewReward({
        title: "",
        description: "",
        frequency: "daily",
        points: 100,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Available Points</CardTitle>
            <CardDescription>Points earned from completing tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">1,250</p>
                <p className="text-sm text-muted-foreground">Current balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Rewards Claimed</CardTitle>
            <CardDescription>Total rewards you've earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{rewards.filter((r) => r.claimed).length}</p>
                <p className="text-sm text-muted-foreground">Rewards claimed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Add New Reward</CardTitle>
            <CardDescription>Create a custom reward</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reward
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Reward</DialogTitle>
                  <DialogDescription>Add a reward to motivate yourself to complete tasks</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Reward Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Coffee break, Movie night"
                      value={newReward.title}
                      onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Describe your reward"
                      value={newReward.description}
                      onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <RadioGroup
                      defaultValue="daily"
                      onValueChange={(value) => setNewReward({ ...newReward, frequency: value })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="instant" id="instant" />
                        <Label htmlFor="instant">Instant</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily">Daily</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly">Weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly">Monthly</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Points Required</Label>
                    <Select
                      defaultValue="100"
                      onValueChange={(value) => setNewReward({ ...newReward, points: Number.parseInt(value) })}
                    >
                      <SelectTrigger id="points">
                        <SelectValue placeholder="Select points" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 points</SelectItem>
                        <SelectItem value="100">100 points</SelectItem>
                        <SelectItem value="200">200 points</SelectItem>
                        <SelectItem value="500">500 points</SelectItem>
                        <SelectItem value="1000">1000 points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleAddReward}>Add Reward</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="available">
        <TabsList className="mb-4">
          <TabsTrigger value="available">Available Rewards</TabsTrigger>
          <TabsTrigger value="claimed">Claimed Rewards</TabsTrigger>
          <TabsTrigger value="suggested">Suggested Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {rewards.filter((r) => !r.claimed).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Available Rewards</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first reward to motivate yourself to complete tasks
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reward
                    </Button>
                  </DialogTrigger>
                  {/* Dialog content is the same as above */}
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards
                .filter((r) => !r.claimed)
                .map((reward) => (
                  <Card key={reward.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{reward.title}</CardTitle>
                        <div className="flex items-center bg-primary/10 text-primary text-sm font-medium rounded-full px-2 py-1">
                          <Star className="h-3.5 w-3.5 mr-1" />
                          {reward.points}
                        </div>
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {reward.frequency.charAt(0).toUpperCase() + reward.frequency.slice(1)} reward
                        </div>
                        <Button size="sm" onClick={() => claimReward(reward.id)}>
                          Claim
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claimed" className="space-y-4">
          {rewards.filter((r) => r.claimed).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Claimed Rewards Yet</h3>
                <p className="text-muted-foreground">Complete tasks to earn points and claim rewards</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards
                .filter((r) => r.claimed)
                .map((reward) => (
                  <Card key={reward.id} className="opacity-70">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{reward.title}</CardTitle>
                        <div className="flex items-center bg-primary/10 text-primary text-sm font-medium rounded-full px-2 py-1">
                          <Star className="h-3.5 w-3.5 mr-1" />
                          {reward.points}
                        </div>
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Claimed on {new Date().toLocaleDateString()}
                        </div>
                        <div className="text-sm font-medium text-green-600">Claimed</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggested" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                id: "s1",
                title: "Coffee Break",
                description: "Take a 15-minute coffee break",
                points: 50,
                frequency: "daily",
              },
              {
                id: "s2",
                title: "Movie Night",
                description: "Watch your favorite movie",
                points: 200,
                frequency: "weekly",
              },
              {
                id: "s3",
                title: "Buy Something Nice",
                description: "Treat yourself to something you've been wanting",
                points: 500,
                frequency: "monthly",
              },
              {
                id: "s4",
                title: "Extra Sleep",
                description: "Sleep in for an extra hour",
                points: 100,
                frequency: "weekly",
              },
              {
                id: "s5",
                title: "Social Media Time",
                description: "15 minutes of guilt-free social media browsing",
                points: 50,
                frequency: "daily",
              },
              {
                id: "s6",
                title: "Favorite Meal",
                description: "Order your favorite meal",
                points: 300,
                frequency: "weekly",
              },
            ].map((reward) => (
              <Card key={reward.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{reward.title}</CardTitle>
                    <div className="flex items-center bg-primary/10 text-primary text-sm font-medium rounded-full px-2 py-1">
                      <Star className="h-3.5 w-3.5 mr-1" />
                      {reward.points}
                    </div>
                  </div>
                  <CardDescription>{reward.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {reward.frequency.charAt(0).toUpperCase() + reward.frequency.slice(1)} reward
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        addReward({
                          id: Date.now().toString(),
                          title: reward.title,
                          description: reward.description,
                          points: reward.points,
                          frequency: reward.frequency,
                          claimed: false,
                          dateAdded: new Date().toISOString(),
                        })
                      }}
                    >
                      Add to My Rewards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

