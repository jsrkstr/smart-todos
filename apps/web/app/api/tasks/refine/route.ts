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
      }
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error'
      console.error('Invalid JSON in request body:', errorMessage)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Fetch the original task with all its details
    const originalTask = await TaskService.getTask(taskData.id, taskData.userId)
    if (!originalTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Prepare task data for OpenAI
    const taskForAI = {
      id: originalTask.id,
      title: originalTask.title,
      description: originalTask.description || '',
      priority: originalTask.priority,
      stage: originalTask.stage,
      deadline: originalTask.deadline,
      estimatedTimeMinutes: originalTask.estimatedTimeMinutes,
      location: originalTask.location || '',
      why: originalTask.why || '',
      // Use type assertion to handle tags
      tags: Array.isArray((originalTask as any).tags) 
        ? (originalTask as any).tags.map((tag: Tag) => ({
            name: tag.name,
            category: tag.category?.name || ''
          })) 
        : []
    }

    // Send data to OpenAI for refinement
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are a task optimization assistant.
            Your job is to improve task descriptions, suggest appropriate tags, refine deadlines, and estimate time better.
            Start by understanding the task, if you less than 90% sure about the task, ask a question to the user.
            Provide output in JSON format only with these fields: response_type (must be 'task_details', 'question'), question (if response_type=question), understand_percentage (if response_type=question), task_details (if response_type=task_details, nested fields: title, description, priority (must be 'low', 'medium', or 'high'), deadline (ISO string or null), estimatedTimeMinutes (number), location (string), why (string), tags (max 2, object with fields name (string) and category (string))).
          `
        },
        {
          role: "user",
          content: `Please refine this task by providing a more detailed description, better tags, and more accurate time estimates and deadlines if needed:\n${JSON.stringify(taskForAI, null, 2)}`
        }
      ],
      response_format: { type: "json_object" }
    })

    // Parse the AI response
    const responseData = JSON.parse(aiResponse.choices[0].message.content || '{}')
    console.log('AI response', responseData);

    if (responseData.response_type === 'question') {
      // Save the question directly using prisma
      const message = await prisma.chatMessage.create({
        data: {
          userId: req.user.id,
          taskId: taskData.id,
          content: responseData.question,
          role: 'assistant',
          metadata: {
            understand_percentage: responseData.understand_percentage || 0,
            type: "question"
          }
        }
      })
      
      // Return a 200 response with the question as data
      return NextResponse.json({ 
        type: 'question',
        message: message,
        understand_percentage: responseData.understand_percentage || 0
      })
    }
    
    const refinedData = responseData.task_details;
    
    // Prepare the update data with proper type validation
    const updates: UpdateTaskInput = {
      id: taskData.id,
      userId: taskData.userId,
      title: refinedData.title,
      description: refinedData.description,
      // Ensure priority is one of the valid TaskPriority values
      priority: ['low', 'medium', 'high'].includes(refinedData.priority?.toLowerCase()) 
        ? refinedData.priority.toLowerCase() as TaskPriority
        : undefined,
      deadline: refinedData.deadline ? new Date(refinedData.deadline) : undefined,
      estimatedTimeMinutes: typeof refinedData.estimatedTimeMinutes === 'number' 
        ? refinedData.estimatedTimeMinutes 
        : undefined,
      why: refinedData.why,
      location: refinedData.location,
    }

    // Handle tags from AI response
    if (refinedData.tags && Array.isArray(refinedData.tags)) {
      // Fetch all existing tags and categories upfront
      const [allTags, allCategories] = await Promise.all([
        TagService.getTags(),
        TagService.getTagCategories()
      ])

      const tagIds: string[] = []

      for (const tagData of refinedData.tags) {
        // Find existing tag by name
        let existingTag = allTags.find((t) => t.name.toLowerCase() === tagData.name.toLowerCase())
        
        if (!existingTag) {
          console.log('creating tag', tagData);
          // If tag doesn't exist, handle category first
          let categoryId: string | undefined
          
          if (tagData.category) {
            // Find existing category
            let category = allCategories.find((c) => c.name.toLowerCase() === tagData.category.toLowerCase())
            
            if (!category) {
              console.log('creating category', tagData);
              // Create new category if it doesn't exist
              category = await TagService.createTagCategory({ name: tagData.category })
              allCategories.push(category) // Add to our cache
            }
            
            categoryId = category.id
          }

          // Create new tag with category
          existingTag = await TagService.createTag({
            name: tagData.name,
            color: '#808080', // Default gray color
            categoryId
          })
          allTags.push(existingTag) // Add to our cache
        }

        tagIds.push(existingTag.id)
      }

      updates.tagIds = tagIds
    }

    // Update the task with the refined data
    const task = await TaskService.updateTask(updates)

    // Save a success message directly using prisma
    await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        taskId: taskData.id,
        content: "Task has been successfully refined with AI assistance.",
        role: ChatMessageRole.system,
        metadata: {
          type: "info",
          refinement: true
        }
      }
    })

    return NextResponse.json({
      type: 'task_details',
      task: {
        ...task,
        date: task.date.toISOString(),
        deadline: task.deadline?.toISOString() || null,
        dateAdded: task.dateAdded.toISOString(),
      }
    })
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to refine task:', errorMessage)
    return NextResponse.json({ error: 'Failed to refine task' }, { status: 500 })
  }
})