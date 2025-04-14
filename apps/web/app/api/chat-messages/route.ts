import { NextRequest, NextResponse } from 'next/server'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { ChatMessageService } from '@/lib/services/chatMessageService'
import { ChatMessageRole, Task } from '@prisma/client'
import { openai } from "@ai-sdk/openai"
import { appendResponseMessages, streamText } from "ai"
import { TaskService } from '@/lib/services/taskService'

// GET /api/chat-messages (optionally with ?taskId=xxx&latest=true)
export const GET = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    const url = new URL(req.url)
    const taskId = url.searchParams.get('taskId')
    const latest = url.searchParams.get('latest') === 'true'

    let messages = await ChatMessageService.getMessages(taskId || undefined)

    // If latest=true is specified, return only the most recent message
    if (latest && messages.length > 0) {
      // Sort by createdAt descending
      messages = messages.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 1)
    }

    return NextResponse.json(messages)
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to get messages:', errorMessage)
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
})

// POST /api/chat-messages
export const POST = withAuth(async (req: AuthenticatedApiRequest) => {
  try {
    const payload = await req.json()

    // Validate required fields
    if (!payload.messages || !payload.taskId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // // Validate required fields
    // if (!payload.content || !payload.role) {
    //   return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    // }

    // // Ensure role is a valid enum value
    // if (!Object.values(ChatMessageRole).includes(payload.role)) {
    //   return NextResponse.json({ error: 'Invalid role value' }, { status: 400 })
    // }

    const latestMessage = payload.messages[payload.messages.length - 1];

    // Store the latest message from user
    await ChatMessageService.createMessage({
      userId: req.user.id,
      taskId: payload.taskId,
      content: latestMessage.content,
      role: latestMessage.role,
      metadata: latestMessage.metadata || {},
    })

    const { messages } = payload;

    const task: Task | null = await TaskService.processTask({
      id: payload.taskId,
      userId: req.user.id,
    });

    let returnMessage = 'Message Delivered';

    if (task?.stageStatus === 'QuestionAsked') {
      const messages = await ChatMessageService.getMessages(task.id)
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && latestMessage.role === 'assistant') {
        returnMessage = latestMessage.content;
      }
    }

    // Create a streaming response compatible with useChat hook
    const encoder = new TextEncoder();
    const messageId = crypto.randomUUID();

    const stream = new ReadableStream({
      start(controller) {
        // 1. Start Step Part
        controller.enqueue(
          encoder.encode(`f:${JSON.stringify({ messageId })}\n`)
        );

        // 2. Text content (can send multiple chunks like this)
        controller.enqueue(
          encoder.encode(`0: \"${returnMessage}\"\n`)
        );

        // 3. Finish Step Part
        controller.enqueue(
          encoder.encode(
            `e:${JSON.stringify({
              finishReason: "stop",
              usage: { promptTokens: 5, completionTokens: 5 },
              isContinued: false
            })}\n`
          )
        );

        // 4. Finish Message Part
        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: "stop",
              usage: { promptTokens: 5, completionTokens: 5 }
            })}\n`
          )
        );

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/text',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'x-vercel-ai-data-stream': 'v1',
      },
    });

  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to create message:', errorMessage)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
})

// DELETE /api/chat-messages
export const DELETE = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    const payload = await req.json()

    if (!payload.id) {
      return NextResponse.json({ error: 'Missing message ID' }, { status: 400 })
    }

    const success = await ChatMessageService.deleteMessage(payload.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to delete message:', errorMessage)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}) 