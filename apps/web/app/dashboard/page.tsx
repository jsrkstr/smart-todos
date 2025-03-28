import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to SmartTodos</h1>
        <p className="text-muted-foreground">
          Your smart productivity assistant with personalized coaching.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Your Tasks</CardTitle>
            <CardDescription>Manage your daily tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">12</div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Your Coach</CardTitle>
            <CardDescription>Your motivational assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">Marie</div>
              <Link href="/dashboard/my-coach">
                <Button variant="ghost" size="sm" className="gap-1">
                  View details <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Today's Focus</CardTitle>
            <CardDescription>Top priority tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">3 tasks</div>
              <Link href="/focus">
                <Button variant="ghost" size="sm" className="gap-1">
                  Start focus <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 