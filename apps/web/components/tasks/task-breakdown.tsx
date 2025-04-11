"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle, ChevronDown, ChevronUp, Loader2, Plus, Timer, Award, Calendar, Bell } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SubTask, Task } from "@/types/task"
import { useTasks } from "@/hooks/use-tasks"
import { Reward } from "@/types/reward"
import { useRewards } from "@/hooks/use-rewards"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface TaskBreakdownProps {
  task: Task
  onComplete?: () => void
}

export function TaskBreakdown({ task, onComplete }: TaskBreakdownProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>(task.subTasks || [])
  const [newSubTask, setNewSubTask] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddManual, setShowAddManual] = useState(false)
  const [activeTab, setActiveTab] = useState("breakdown")
  const [reminderDialog, setReminderDialog] = useState(false)
  const [reminderDate, setReminderDate] = useState<Date | undefined>(task.deadline ? new Date(task.deadline) : undefined)
  const [reminderTime, setReminderTime] = useState<string>(task.time || "")
  const [reminderType, setReminderType] = useState<string>("time")
  const [reminderLocation, setReminderLocation] = useState<string>(task.location || "")
  const [scheduleDialog, setScheduleDialog] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date(task.date))
  const [rewardDialog, setRewardDialog] = useState(false)
  const { updateTask, updateTaskStatus } = useTasks()
  const { rewards, linkTaskToReward } = useRewards()
  const { toast } = useToast()

  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return
    
    const newSubTaskObj: SubTask = {
      title: newSubTask.trim(),
      status: "new",
      position: subTasks.length
    }
    
    setSubTasks([...subTasks, newSubTaskObj])
    setNewSubTask("")
  }

  const handleToggleSubTask = (index: number, checked: boolean) => {
    const updatedSubTasks = [...subTasks]
    updatedSubTasks[index].status = checked ? "completed" : "new"
    setSubTasks(updatedSubTasks)
  }

  const handleRemoveSubTask = (index: number) => {
    const updatedSubTasks = [...subTasks]
    updatedSubTasks.splice(index, 1)
    // Update positions
    updatedSubTasks.forEach((st, idx) => {
      st.position = idx
    })
    setSubTasks(updatedSubTasks)
  }

  const handleMoveSubTask = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === subTasks.length - 1)
    ) {
      return
    }

    const updatedSubTasks = [...subTasks]
    const newIndex = direction === "up" ? index - 1 : index + 1
    
    // Swap subtasks
    const temp = updatedSubTasks[index]
    updatedSubTasks[index] = updatedSubTasks[newIndex]
    updatedSubTasks[newIndex] = temp
    
    // Update positions
    updatedSubTasks.forEach((st, idx) => {
      st.position = idx
    })
    
    setSubTasks(updatedSubTasks)
  }
  
  const handleEstimateTime = (index: number, minutes: number) => {
    const updatedSubTasks = [...subTasks]
    updatedSubTasks[index].estimatedTimeMinutes = minutes
    setSubTasks(updatedSubTasks)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await updateTask(task.id, { 
        subTasks,
        status: "planned" 
      })
      
      toast({
        title: "Task updated",
        description: "Your task has been successfully planned"
      })
      
      if (onComplete) onComplete()
    } catch (err) {
      setError("Failed to save subtasks. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveReminder = async () => {
    setIsLoading(true)
    
    try {
      await updateTask(task.id, {
        deadline: reminderDate,
        time: reminderTime,
        location: reminderType === "location" ? reminderLocation : undefined
      })
      
      toast({
        title: "Reminder set",
        description: "Your reminder has been successfully set"
      })
      
      setReminderDialog(false)
    } catch (err) {
      setError("Failed to set reminder. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleTask = async () => {
    setIsLoading(true)
    
    try {
      await updateTask(task.id, {
        date: scheduledDate
      })
      
      toast({
        title: "Task scheduled",
        description: "Your task has been successfully scheduled"
      })
      
      setScheduleDialog(false)
    } catch (err) {
      setError("Failed to schedule task. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkReward = async (rewardId: string) => {
    setIsLoading(true)
    
    try {
      await linkTaskToReward(task.id, rewardId)
      
      toast({
        title: "Reward linked",
        description: "This reward has been linked to your task"
      })
      
      setRewardDialog(false)
    } catch (err) {
      setError("Failed to link reward. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAIBreakdown = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/tasks/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.why || "",
          existingSubTasks: task.subTasks || []
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to generate subtasks")
      }
      
      const data = await response.json()
      
      if (data.subtasks?.length) {
        // Add any new AI-generated subtasks
        const newSubTasksList = data.subtasks.map((st: any, i: number) => ({
          title: st.title,
          status: "new",
          position: subTasks.length + i,
          estimatedTimeMinutes: st.estimatedTimeMinutes || null
        }))
        
        setSubTasks([...subTasks, ...newSubTasksList])
      }
    } catch (err) {
      setError("Failed to generate subtasks. Please manually or try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteTask = async () => {
    setIsLoading(true)
    
    try {
      await updateTaskStatus(task.id, "completed")
      
      toast({
        title: "Task completed!",
        description: "Congratulations on completing your task"
      })
      
      if (onComplete) onComplete()
    } catch (err) {
      setError("Failed to mark task as complete. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getPomodoroCount = (minutes?: number) => {
    if (!minutes) return "?"
    return Math.ceil(minutes / 25) // Assuming 25 min pomodoros
  }

  const getTotalEstimatedTime = () => {
    return subTasks.reduce((total, subtask) => {
      return total + (subtask.estimatedTimeMinutes || 0)
    }, 0)
  }

  const getCompletedSubtasksCount = () => {
    return subTasks.filter(subtask => subtask.status === "completed").length
  }

  const getProgressPercentage = () => {
    if (subTasks.length === 0) return 0
    return Math.round((getCompletedSubtasksCount() / subTasks.length) * 100)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Task: {task.title}</CardTitle>
            <CardDescription>
              Manage your task through its lifecycle
            </CardDescription>
          </div>
          <div>
            {task.pointsReward && (
              <Badge variant="outline" className="ml-2 bg-primary/10">
                <Award className="h-3 w-3 mr-1" />
                {task.pointsReward} points reward
              </Badge>
            )}
            {task.linkedReward && (
              <Badge variant="outline" className="ml-2 bg-secondary/20">
                <Award className="h-3 w-3 mr-1" />
                {task.linkedReward.title}
              </Badge>
            )}
            <Badge className="ml-2" variant={task.status === "new" ? "outline" : (task.status === "planned" ? "secondary" : "default")}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {task.why && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Why this task matters:</p>
            <p className="text-sm">{task.why}</p>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="breakdown" value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="breakdown" className="space-y-4 pt-4">
            <div className="space-y-2 mb-6">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAIBreakdown}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Let AI suggest subtasks
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowAddManual(!showAddManual)}
              >
                {showAddManual ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                Add subtasks manually
              </Button>
              
              {showAddManual && (
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    value={newSubTask}
                    onChange={(e) => setNewSubTask(e.target.value)}
                    placeholder="Enter a subtask..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSubTask()
                      }
                    }}
                  />
                  <Button onClick={handleAddSubTask} size="sm">
                    Add
                  </Button>
                </div>
              )}
            </div>
            
            {subTasks.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium mb-2">Subtasks ({subTasks.length})</h3>
                
                {subTasks.map((subtask, index) => (
                  <div key={index} className="flex flex-col border rounded-md p-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        checked={subtask.status === "completed"}
                        onCheckedChange={(checked) => handleToggleSubTask(index, !!checked)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm font-medium">{subtask.title}</span>
                          {subtask.estimatedTimeMinutes && (
                            <span className="flex items-center text-xs text-muted-foreground">
                              <Timer className="h-3 w-3 mr-1" />
                              {subtask.estimatedTimeMinutes} min 
                              ({getPomodoroCount(subtask.estimatedTimeMinutes)} pomodoros)
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
                            onClick={() => handleEstimateTime(index, subtask.estimatedTimeMinutes ? subtask.estimatedTimeMinutes + 5 : 25)}
                          >
                            {subtask.estimatedTimeMinutes ? '+5 min' : 'Add time'}
                          </Button>
                          
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" 
                            onClick={() => handleMoveSubTask(index, "up")}
                            disabled={index === 0}
                          >
                            Move up
                          </Button>
                          
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" 
                            onClick={() => handleMoveSubTask(index, "down")}
                            disabled={index === subTasks.length - 1}
                          >
                            Move down
                          </Button>
                          
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
                            onClick={() => handleRemoveSubTask(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {subTasks.length > 0 && (
                  <div className="mt-4 bg-muted p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total estimated time:</span>
                      <span className="text-sm">
                        {getTotalEstimatedTime()} min ({getPomodoroCount(getTotalEstimatedTime())} pomodoros)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/50 rounded-md">
                <p className="text-muted-foreground">No subtasks added yet. Break down your task into smaller steps.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="planning" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-none border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Set Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set time or location-based reminders for this task
                  </p>
                  <div className="flex flex-col gap-2">
                    {task.deadline && (
                      <div className="text-sm">
                        <span className="font-medium">Deadline: </span>
                        {new Date(task.deadline).toLocaleDateString()}
                        {task.time && ` at ${task.time}`}
                      </div>
                    )}
                    {task.location && (
                      <div className="text-sm">
                        <span className="font-medium">Location: </span>
                        {task.location}
                      </div>
                    )}
                    <Button variant="outline" onClick={() => setReminderDialog(true)}>
                      <Bell className="mr-2 h-4 w-4" />
                      {task.deadline || task.location ? 'Update Reminder' : 'Set Reminder'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-none border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose when to work on this task
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="text-sm">
                      <span className="font-medium">Scheduled for: </span>
                      {new Date(task.date).toLocaleDateString()}
                    </div>
                    <Button variant="outline" onClick={() => setScheduleDialog(true)}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Reschedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-none border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Link Reward</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Motivate yourself by linking a reward
                  </p>
                  <div className="flex flex-col gap-2">
                    {task.linkedReward ? (
                      <div className="text-sm">
                        <span className="font-medium">Linked reward: </span>
                        {task.linkedReward.title} ({task.linkedReward.pointsCost} points)
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No reward linked</p>
                    )}
                    <Button variant="outline" onClick={() => setRewardDialog(true)}>
                      <Award className="mr-2 h-4 w-4" />
                      {task.linkedReward ? 'Change Reward' : 'Link a Reward'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-none border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Points you'll earn when completing this task
                  </p>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-lg font-medium">
                      {task.pointsReward || (subTasks.length * 5)} points
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="execution" className="space-y-6 pt-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="text-base font-medium mb-2">Progress</h3>
              <div className="w-full bg-secondary/30 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{getCompletedSubtasksCount()} of {subTasks.length} subtasks completed</span>
                <span>{getProgressPercentage()}%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-none border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Focus Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a pomodoro timer to work on this task
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = `/pomodoro?taskId=${task.id}`}>
                    <Timer className="mr-2 h-4 w-4" />
                    Start Pomodoro
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="shadow-none border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Mark as Complete</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you've finished all subtasks, complete the task
                  </p>
                  <Button
                    variant="default"
                    onClick={handleCompleteTask}
                    disabled={isLoading || getCompletedSubtasksCount() < subTasks.length}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Complete Task
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onComplete}>
          Cancel
        </Button>
        {activeTab === "breakdown" && (
          <Button
            onClick={handleSave}
            disabled={isLoading || subTasks.length === 0}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save and Plan
          </Button>
        )}
      </CardFooter>
      
      <Dialog open={reminderDialog} onOpenChange={setReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Task Reminder</DialogTitle>
            <DialogDescription>
              Choose how and when you want to be reminded
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reminderType">Reminder Type</Label>
              <Select 
                value={reminderType} 
                onValueChange={setReminderType}
              >
                <SelectTrigger id="reminderType">
                  <SelectValue placeholder="Select reminder type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Time-based</SelectItem>
                  <SelectItem value="location">Location-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reminderType === "time" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="deadlineDate">Deadline Date</Label>
                  <DatePicker
                    date={reminderDate}
                    setDate={setReminderDate}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadlineTime">Time (Optional)</Label>
                  <TimePicker
                    value={reminderTime}
                    onChange={setReminderTime}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="E.g., Supermarket, Office, Home"
                  value={reminderLocation}
                  onChange={(e) => setReminderLocation(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveReminder}
              disabled={isLoading || (reminderType === "time" && !reminderDate) || (reminderType === "location" && !reminderLocation)}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Task</DialogTitle>
            <DialogDescription>
              Choose when to work on this task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date</Label>
              <DatePicker
                date={scheduledDate}
                setDate={setScheduledDate}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleTask}
              disabled={isLoading || !scheduledDate}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link a Reward</DialogTitle>
            <DialogDescription>
              Link this task to a reward for motivation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {rewards.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      task.rewardId === reward.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleLinkReward(reward.id as string)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{reward.title}</h4>
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                        <div className="flex items-center mt-1">
                          <Award className="h-3.5 w-3.5 text-primary mr-1" />
                          <span className="text-sm">{reward.pointsCost} points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No rewards available. Create rewards first.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 