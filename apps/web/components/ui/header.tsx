"use client"

import { Bell, Menu, Moon, Search, Sun, LogOut, User, Settings, Timer } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/use-notifications"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"

interface Notification {
  id: string
  title: string
  body: string
  timestamp: string
  read: boolean
}

import { PomodoroDialog } from "@/components/tasks/pomodoro-dialog"
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer"

interface HeaderProps {
  onMenuClick: () => void
  currentPage?: string
  // Optional: callback for Pomodoro dialog open from tasks-list
  children?: React.ReactNode
}

export function Header({ onMenuClick, currentPage = "Smart Todos", children }: HeaderProps) {
  // Pomodoro dialog state
  const [pomodoroDialogOpen, setPomodoroDialogOpen] = useState(false)
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null)
  const {
    isActive: pomodoroActive,
    timeLeft: pomodoroTimeLeft
  } = usePomodoroTimer()

  // Callback to be passed to children (tasks-list)
  const handleOpenPomodoro = useCallback((taskId: string | null = null) => {
    setPomodoroTaskId(taskId)
    setPomodoroDialogOpen(true)
  }, [])

  const { setTheme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      const parsedNotifications = JSON.parse(savedNotifications)
      setNotifications(parsedNotifications)
      setUnreadCount(parsedNotifications.filter((n: Notification) => !n.read).length)
    }
  }, [])

  const addNotification = (title: string, body: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
    }

    const updatedNotifications = [newNotification, ...notifications].slice(0, 50) // Keep last 50 notifications
    setNotifications(updatedNotifications)
    setUnreadCount(unreadCount + 1)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updatedNotifications)
    setUnreadCount(0)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const handleLogout = () => {
    // Use the logout function from auth context
    logout()
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="flex h-16 items-center px-2 lg:px-4 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-primary text-xl">{currentPage}</span>
        </Link>
        <div className="ml-auto flex items-center gap-2 pr-4">
          {/* Pomodoro Timer Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setPomodoroDialogOpen(true)}
          >
            <Timer className="h-5 w-5" />
            {pomodoroActive && (
              <span className="text-xs font-mono text-primary mr-2">
                {`${Math.floor(pomodoroTimeLeft / 60).toString().padStart(2, '0')}:${(pomodoroTimeLeft % 60).toString().padStart(2, '0')}`}
              </span>
            )}
            <span className="sr-only">Pomodoro Timer</span>
          </Button>
          <form className="hidden md:flex relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search tasks..." className="w-full pl-8" />
          </form>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <h3 className="font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 ${!notification.read ? 'bg-muted/50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.body}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="/avatar.jpg" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Pomodoro Dialog rendered in header */}
      <PomodoroDialog
        open={pomodoroDialogOpen}
        onOpenChange={setPomodoroDialogOpen}
        selectedTaskId={pomodoroTaskId}
      />
      {/* Render children with injected openPomodoro callback if any */}
      {children && typeof children === 'function'
        ? children({ openPomodoro: handleOpenPomodoro })
        : children}
    </header>
  )
}

