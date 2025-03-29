import { PrismaClient } from '@prisma/client'

interface CustomNodeJsGlobal {
  prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma: CustomNodeJsGlobal = globalThis as unknown as CustomNodeJsGlobal

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// // Helper function to initialize the database with necessary seed data
// export async function initializeDatabase() {
//   try {
//     console.log("Initializing database...");
    
//     // Dynamically import to avoid issues with circular dependencies
//     const coachService = await import('./services/coach-service');
    
//     // Seed system coaches
//     await coachService.seedSystemCoaches();
    
//     console.log("Database initialization complete");
//     return { success: true };
//   } catch (error) {
//     // Return an object instead of throwing to avoid type issues
//     console.error("Database initialization failed:", error);
//     return { success: false, error };
//   }
// }

// // Initialize database if we're in a server context
// if (typeof window === 'undefined') {
//   initializeDatabase()
//     .then(result => {
//       if (!result.success) {
//         console.warn("Database initialization warning - app may not function correctly");
//       }
//     })
//     .catch(e => {
//       console.error('Unexpected error in database initialization:', e);
//     });
// } 