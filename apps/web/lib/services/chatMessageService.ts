import { ChatMessage, Prisma, ChatMessageRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface ChatMessageCreateInput {
  userId: string;
  taskId: string;
  content: string;
  role: ChatMessageRole;
  metadata?: Record<string, any>;
  externalId?: string;
}

export interface ChatMessageUpdateInput {
  id: string;
  content?: string;
  metadata?: Record<string, any>;
}

export class ChatMessageService {
  static async getMessages(taskId?: string): Promise<ChatMessage[]> {
    const whereClause = taskId ? { taskId } : {}
    
    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    return messages
  }

  static async getMessage(messageId: string): Promise<ChatMessage | null> {
    const message = await prisma.chatMessage.findUnique({
      where: {
        id: messageId
      }
    })
    
    return message
  }

  static async createMessage(input: ChatMessageCreateInput): Promise<ChatMessage> {
    const message = await prisma.chatMessage.create({
      data: input
    })
    
    return message
  }

  static async updateMessage(input: ChatMessageUpdateInput): Promise<ChatMessage> {
    const { id, ...updates } = input
    
    const message = await prisma.chatMessage.update({
      where: {
        id
      },
      data: updates
    })
    
    return message
  }

  static async deleteMessage(messageId: string): Promise<boolean> {
    await prisma.chatMessage.delete({
      where: {
        id: messageId
      }
    })
    
    return true
  }
} 