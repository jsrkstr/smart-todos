import { AuthenticatedApiRequest, withAuth } from "@/lib/api-middleware";
import { NextResponse } from "next/server";
import { ChatMessageService } from "@/lib/services/chatMessageService";
import { ChatMessageRole } from "@prisma/client";

const AGENT_API_URL = process.env.AGENT_API_URL || "http://localhost:8001";

export const POST = withAuth(async (req: AuthenticatedApiRequest): Promise<Response> => {
  try {
    const { message, taskId } = await req.json();
    const userId = req.user.id;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Store the user message to the database
    await ChatMessageService.createMessage({
      userId,
      taskId: taskId || undefined,
      content: message,
      role: ChatMessageRole.user
    });

    // Generate a thread ID based on userId and taskId
    const threadId = taskId ? `${userId}-${taskId}` : userId;

    // Call the Python agent API
    const response = await fetch(`${AGENT_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        message,
        threadId,
        taskId: taskId || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Agent API error: ${errorData.detail || response.statusText}`);
    }

    const result = await response.json();

    // Store the assistant's message to the database
    if (result.response) {
      await ChatMessageService.createMessage({
        userId,
        taskId: taskId || undefined,
        content: result.response,
        role: ChatMessageRole.assistant
      });
    }

    return NextResponse.json({
      response: result.response,
      error: result.error
    });
  } catch (error) {
    console.error("Error in agent chat API:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
});
