import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Starting database cleanup...')

    // Delete in order of dependencies to avoid foreign key constraint issues
    console.log('Deleting calendar events...')
    await prisma.$executeRawUnsafe('DELETE FROM "CalendarEvent";')

    console.log('Deleting calendar connections...')
    await prisma.$executeRawUnsafe('DELETE FROM "CalendarConnection";')

    console.log('Deleting chat messages...')
    await prisma.chatMessage.deleteMany()

    console.log('Deleting pomodoros...')
    await prisma.pomodoro.deleteMany()

    console.log('Deleting tasks and related objects...')
    // Delete tasks which will cascade delete subtasks due to referential actions
    await prisma.task.deleteMany()

    console.log('Database cleanup completed successfully!')
  } catch (error) {
    console.error('Error during database cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}) 