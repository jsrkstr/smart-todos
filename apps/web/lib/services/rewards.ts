import { PrismaClient } from '@prisma/client';
import type { Task, User, Reward, Streak } from '@prisma/client';

export class RewardsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Calculate points based on task properties
  private calculateTaskPoints(task: Task): number {
    let points = 10; // Base points

    // Add points based on priority
    switch (task.priority) {
      case 'high':
        points += 10;
        break;
      case 'medium':
        points += 5;
        break;
      case 'low':
        points += 2;
        break;
    }

    // Add points for estimated time (1 point per 10 minutes)
    if (task.estimatedTimeMinutes) {
      points += Math.floor(task.estimatedTimeMinutes / 10);
    }

    return points;
  }

  // Award points for task completion
  async awardTaskCompletion(taskId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { user: true }
    });

    if (!task || !task.user) return;

    const points = this.calculateTaskPoints(task);

    // Update user points
    await this.prisma.user.update({
      where: { id: task.userId },
      data: {
        points: {
          increment: points
        }
      }
    });

    // Update task points
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        points
      }
    });
  }

  // Update daily streak
  async updateDailyStreak(userId: string): Promise<void> {
    const streak = await this.prisma.streak.findFirst({
      where: {
        userId,
        type: 'daily'
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      await this.prisma.streak.create({
        data: {
          userId,
          type: 'daily',
          count: 1,
          lastDate: today
        }
      });
      return;
    }

    const lastDate = new Date(streak.lastDate);
    lastDate.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate.getTime() === yesterday.getTime()) {
      await this.prisma.streak.update({
        where: { id: streak.id },
        data: {
          count: {
            increment: 1
          },
          lastDate: today
        }
      });
    } else if (lastDate.getTime() < yesterday.getTime()) {
      await this.prisma.streak.update({
        where: { id: streak.id },
        data: {
          count: 1,
          lastDate: today
        }
      });
    }
  }

  // Create a new reward
  async createReward(data: {
    name: string;
    description?: string;
    points: number;
    userId: string;
    taskId?: string;
  }): Promise<{ id: string }> {
    return this.prisma.reward.create({
      data: {
        name: data.name,
        description: data.description,
        points: data.points,
        userId: data.userId,
        taskId: data.taskId
      },
      select: { id: true }
    });
  }

  // Claim a reward
  async claimReward(rewardId: string, userId: string): Promise<boolean> {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
      include: { user: true }
    });

    if (!reward || reward.userId !== userId || reward.claimed) {
      return false;
    }

    if (reward.user.points < reward.points) {
      return false;
    }

    await this.prisma.reward.update({
      where: { id: rewardId },
      data: { claimed: true }
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          decrement: reward.points
        }
      }
    });

    return true;
  }

  // Get leaderboard
  async getLeaderboard(): Promise<Array<{
    id: string;
    name: string | null;
    points: number;
    streaks: Array<{ type: string; count: number }>;
  }>> {
    const users = await this.prisma.user.findMany({
      orderBy: {
        points: 'desc'
      },
      take: 10,
      include: {
        streaks: {
          select: {
            type: true,
            count: true
          }
        }
      }
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      points: user.points,
      streaks: user.streaks.map(streak => ({
        type: streak.type,
        count: streak.count
      }))
    }));
  }
} 