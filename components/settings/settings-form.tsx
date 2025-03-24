"use client"

import { useState } from "react"
import { Bell, Calendar, Clock, Moon, Sun, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"

export function SettingsForm() {
  const { theme, setTheme } = useTheme()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage your app preferences and account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex items-center gap-4">
                <RadioGroup defaultValue={theme} onValueChange={setTheme} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-1.5">
                      <Sun className="h-4 w-4" />
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-1.5">
                      <Moon className="h-4 w-4" />
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pomodoro-duration">Pomodoro Duration (minutes)</Label>
              <Select defaultValue="25">
                <SelectTrigger id="pomodoro-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="25">25 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-break">Short Break Duration (minutes)</Label>
              <Select defaultValue="5">
                <SelectTrigger id="short-break">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="long-break">Long Break Duration (minutes)</Label>
              <Select defaultValue="15">
                <SelectTrigger id="long-break">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds for notifications and timer completion</p>
              </div>
              <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>

            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Manage how and when you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications for tasks and reminders</p>
              </div>
              <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                disabled={!notificationsEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Notification Types</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>Task Reminders</span>
                  </div>
                  <Switch defaultChecked disabled={!notificationsEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Upcoming Deadlines</span>
                  </div>
                  <Switch defaultChecked disabled={!notificationsEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Pomodoro Timer</span>
                  </div>
                  <Switch defaultChecked disabled={!notificationsEnabled} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-time">Default Reminder Time</Label>
              <Select defaultValue="30">
                <SelectTrigger id="reminder-time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="120">2 hours before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button disabled={!notificationsEnabled}>Save Notification Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations">
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect Smart Todos with other apps and services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h4 className="font-medium">Google Calendar</h4>
                    <p className="text-sm text-muted-foreground">Sync your tasks with Google Calendar</p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-green-100 flex items-center justify-center dark:bg-green-900">
                    <ListTodo className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <h4 className="font-medium">Google Tasks</h4>
                    <p className="text-sm text-muted-foreground">Import and export tasks with Google Tasks</p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email for Notifications</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
              <p className="text-xs text-muted-foreground">
                This email will be used for notifications and integrations
              </p>
            </div>

            <Button>Save Integration Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

