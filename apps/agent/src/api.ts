import { NextRequest, NextResponse } from 'next/server';
import { ChatMessageRole } from '@prisma/client';
import { processRequest } from './index';
import { ChatMessageService } from './services/database';

/**
 * API route handler for multi-agent chat processing
 * This can be integrated with the web app or called directly
 */
export async function processAgentRequest(req: NextRequest): Promise<Response> {
  try {
    // Extract request data
    const { messages, taskId, userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Store the user message to the database
    const lastUserMessage = messages.findLast((m: any) => m.role === 'user');
    if (lastUserMessage) {
      await ChatMessageService.createMessage({
        userId,
        taskId: taskId || undefined,
        content: lastUserMessage.content,
        role: ChatMessageRole.user
      });
    }

    // Process the request through our multi-agent system
    const result = await processRequest(
      userId,
      lastUserMessage?.content || '',
      { taskId }
    );

    // Store the assistant's response in the database
    if (result.agentResponse) {
      await ChatMessageService.createMessage({
        userId,
        taskId: taskId || undefined,
        content: result.agentResponse,
        role: ChatMessageRole.assistant,
        metadata: {
          agentType: result.activeAgentType,
          actionItems: result.actionItems
        }
      });
    }

    // Return the response
    return NextResponse.json({
      messages: [...messages, { role: 'assistant', content: result.agentResponse }],
      agentType: result.activeAgentType,
      actionItems: result.actionItems,
      task: result.task,
      error: result.error
    });
  } catch (error) {
    console.error('Error in agent API:', error);
    return NextResponse.json(
      { error: 'Failed to process agent request' },
      { status: 500 }
    );
  }
}

/**
 * Example of how to integrate this with a Next.js API route
 * Implementation might vary depending on your framework
 */
export const POST = async (req: NextRequest): Promise<Response> => {
  return processAgentRequest(req);
};
