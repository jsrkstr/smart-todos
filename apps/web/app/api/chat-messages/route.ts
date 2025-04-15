import { NextRequest, NextResponse } from 'next/server'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'
import { ChatMessageService } from '@/lib/services/chatMessageService'
import { ChatMessageRole, Task } from '@prisma/client'
import { openai } from "@ai-sdk/openai"
import { appendResponseMessages, createDataStreamResponse, streamText } from "ai"
import { TaskService } from '@/lib/services/taskService'

// GET /api/chat-messages (optionally with ?taskId=xxx&latest=true)
export const GET = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    const url = new URL(req.url)
    const taskId = url.searchParams.get('taskId')
    const latest = url.searchParams.get('latest') === 'true'

    let messages = await ChatMessageService.getMessages(taskId || undefined, false)

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

    const response = await TaskService.processTask({
      id: payload.taskId,
      userId: req.user.id,
    });

    const returnMessage = response.message;

    // const response = {
    //   response_type: 'task_details',
    // }

    return createDataStreamResponse({
      execute: dataStream => {
        const messageId = crypto.randomUUID();
        dataStream.write(`f:${JSON.stringify({ messageId })}\n`);
        dataStream.write(`0: \"${returnMessage}\"\n`);
        dataStream.writeMessageAnnotation({ response_type: response.response_type });
        // dataStream.writeData('call completed');
        dataStream.write(`e:${JSON.stringify({
          finishReason: "stop",
          usage: { promptTokens: 5, completionTokens: 5 },
          isContinued: false
        })}\n`)
        dataStream.write(`d:${JSON.stringify({
          finishReason: "stop",
          usage: { promptTokens: 5, completionTokens: 5 }
        })}\n`)
      },
      onError: error => {
        // Error messages are masked by default for security reasons.
        // If you want to expose the error message to the client, you can do so here:
        return error instanceof Error ? error.message : String(error);
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