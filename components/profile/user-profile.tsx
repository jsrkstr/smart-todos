"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useProfile } from "@/hooks/use-profile"
import { PrinciplesList } from "@/components/profile/principles-list"
import { InspirationList } from "@/components/profile/inspiration-list"

export function UserProfile() {
  const { profile, updateProfile, addPrinciple } = useProfile()
  const [newPrinciple, setNewPrinciple] = useState("")

  const handleAddPrinciple = () => {
    if (newPrinciple.trim()) {
      addPrinciple(newPrinciple)
      setNewPrinciple("")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfile({ email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                placeholder="Tell us a bit about yourself"
              />
            </div>

            <Button type="button">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="principles">
        <TabsList className="mb-4">
          <TabsTrigger value="principles">Life Principles</TabsTrigger>
          <TabsTrigger value="inspiration">Inspiration</TabsTrigger>
        </TabsList>

        <TabsContent value="principles">
          <Card>
            <CardHeader>
              <CardTitle>Life Principles & Quotes</CardTitle>
              <CardDescription>Add principles that motivate you to complete your tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new principle or quote"
                  value={newPrinciple}
                  onChange={(e) => setNewPrinciple(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddPrinciple()
                    }
                  }}
                />
                <Button onClick={handleAddPrinciple} size="icon" variant="secondary">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add principle</span>
                </Button>
              </div>

              <PrinciplesList principles={profile.principles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspiration">
          <Card>
            <CardHeader>
              <CardTitle>Inspirational People</CardTitle>
              <CardDescription>Get inspired by high-performing individuals</CardDescription>
            </CardHeader>
            <CardContent>
              <InspirationList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

