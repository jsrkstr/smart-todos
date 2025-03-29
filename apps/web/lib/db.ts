import { PrismaClient } from '@prisma/client'

interface CustomNodeJsGlobal {
  prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma: CustomNodeJsGlobal = globalThis as unknown as CustomNodeJsGlobal

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
