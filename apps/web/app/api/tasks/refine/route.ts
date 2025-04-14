import { NextResponse } from 'next/server'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { TaskService } from '@/lib/services/taskService'
import type { RefineTaskInput, UpdateTaskInput } from '@/lib/services/taskService'
import OpenAI from 'openai'
import { Tag } from '@/types/tag'
import { TaskPriority, TaskStage } from '@/types/task'
import { TagService } from '@/lib/services/tagService'
import { ChatMessageRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/index.mjs'

// Define TagCategory interface if not already defined elsewhere
interface TagCategory {
  id: string;
  name: string;
}

// Local implementation for creating chat messages for the refine endpoint
const createChatMessage = async (data: {
  userId: string;
  taskId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  metadata?: any;
}) => {
  return await prisma.chatMessage.create({
    data: {
      userId: data.userId,
      taskId: data.taskId,
      content: data.content,
      role: data.role as ChatMessageRole,
      metadata: data.metadata
    }
  });
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// PUT /api/tasks/refine
export const PUT = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let taskData: RefineTaskInput
    try {
      const payload = await req.json()
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Missing task ID' }, { status: 400 })
      }

      taskData = {
        id: payload.id,
        userId: req.user.id,
      };
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // // Fetch the original task with all its details
    // const originalTask = await TaskService.getTask(taskData.id, taskData.userId)
    // if (!originalTask) {
    //   return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    // }

    const updatedTask = await TaskService.processTask({
      id: taskData.id,
      userId: taskData.userId,
    })

    if (updatedTask) {
      return NextResponse.json({
        task: {
          ...updatedTask,
          date: updatedTask.date.toISOString(),
          deadline: updatedTask.deadline?.toISOString() || null,
          dateAdded: updatedTask.dateAdded.toISOString(),
        }
      })
    } else {
      throw "Error refining task"
    }
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to refine task:', error, errorMessage)
    return NextResponse.json({ error: 'Failed to refine task' }, { status: 500 })
  }
})