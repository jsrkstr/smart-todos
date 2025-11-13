import { AuthenticatedApiRequest, withAuth } from "@/lib/api-middleware";
import { NextResponse } from "next/server";
import { processRequest } from "@smart-todos/agent";
import { ChatMessageService } from "@/lib/services/chatMessageService";
import { ChatMessageRole } from "@prisma/client";
import { createDataStreamResponse } from "ai";

/**
 * Chat API Route - Integrated with LangGraph Multi-Agent System
 *
 * This endpoint processes user messages through the SmartTodos multi-agent system,
 * which includes specialized agents for:
 * - Task Creation & Refinement
 * - Planning & Breakdown
 * - Execution Coaching
 * - Adaptation & Strategy
 * - Analytics & Insights
 *
 * The agent system uses MCP integration for efficient operations.
 *
 * **Response Format:**
 * - Web (Streaming): Returns AI SDK streaming format (text/x-unknown)
 * - Mobile (JSON): Returns simple JSON with { content, role, agentType, actionItems }
 *
 * The API auto-detects client type based on the Accept header.
 */
export const POST = withAuth(async (req: AuthenticatedApiRequest): Promise<Response> => {
  try {
    const { messages, taskId } = await req.json();
    const userId = req.user.id;

    // Get JWT token from request for MCP authentication
    const authHeader = req.headers.get('authorization');
    const jwtToken = authHeader?.replace('Bearer ', '') || null;

    // Extract the last user message
    const lastUserMessage = messages.findLast((m: any) => m.role === 'user');
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    const userMessage = lastUserMessage.content;

    // Store the user message to the database
    await ChatMessageService.createMessage({
      userId,
      taskId: taskId || undefined,
      content: userMessage,
      role: ChatMessageRole.user
    });

    // Process the request through the multi-agent system
    const result = await processRequest(userId, userMessage, {
      taskId,
      jwtToken: jwtToken || undefined,
      databaseUrl: process.env.DATABASE_URL,
    });

    console.log('[Chat API] Agent result:', {
      agentResponse: result.agentResponse,
      activeAgentType: result.activeAgentType,
      error: result.error,
    });

    // Store the agent's response to the database
    if (result.agentResponse) {
      await ChatMessageService.createMessage({
        userId,
        taskId: taskId || undefined,
        content: result.agentResponse,
        role: ChatMessageRole.assistant,
        metadata: {
          agentType: result.activeAgentType,
          actionItems: result.actionItems,
        }
      });
    }

    const responseContent = result.agentResponse || 'No response generated';

    // Detect client type based on Accept header
    const acceptHeader = req.headers.get('accept') || '';
    const isStreamingClient = acceptHeader.includes('text/event-stream') ||
                              acceptHeader.includes('text/x-unknown');

    // For mobile/Flutter clients: return simple JSON
    if (!isStreamingClient) {
      console.log('[Chat API] Returning JSON response for mobile client');
      return NextResponse.json({
        content: responseContent,
        role: 'assistant',
        agentType: result.activeAgentType,
        actionItems: result.actionItems || [],
        id: `agent-${Date.now()}`,
        error: result.error || null,
      });
    }

    // For web clients: return AI SDK streaming format
    console.log('[Chat API] Returning streaming response for web client');
    return createDataStreamResponse({
      execute: dataStream => {
        const messageId = crypto.randomUUID();
        dataStream.write(`f:${JSON.stringify({ messageId })}\n`);
        dataStream.write(`0: "${responseContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`);
        dataStream.writeMessageAnnotation({
          agentType: result.activeAgentType,
          actionItems: result.actionItems || [],
        });
        dataStream.write(`e:${JSON.stringify({
          finishReason: "stop",
          usage: { promptTokens: 5, completionTokens: 5 },
          isContinued: false
        })}\n`);
        dataStream.write(`d:${JSON.stringify({
          finishReason: "stop",
          usage: { promptTokens: 5, completionTokens: 5 }
        })}\n`);
      },
      onError: error => {
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);

    // Log the error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
});

/**
 * GET endpoint to retrieve chat history
 * Useful for loading previous conversations
 */
export const GET = withAuth(async (req: AuthenticatedApiRequest): Promise<Response> => {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const userId = req.user.id;

    const messages = await ChatMessageService.getMessages(
      userId,
      taskId || undefined
    );

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt,
        metadata: msg.metadata,
      })),
    });
  } catch (error) {
    console.error('Chat History Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve chat history',
      },
      { status: 500 }
    );
  }
});
