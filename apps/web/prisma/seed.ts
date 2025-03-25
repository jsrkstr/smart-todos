import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleTasks = [
  {
    title: "Complete project proposal",
    date: new Date(),
    time: "14:00",
    deadline: new Date(Date.now() + 86400000), // Tomorrow
    dateAdded: new Date(),
    completed: false,
    priority: "high",
    location: "Office",
    why: "This will help advance my career and demonstrate my skills",
    subTasks: [
      { title: "Research competitors", completed: true },
      { title: "Create outline", completed: true },
      { title: "Write first draft", completed: false },
      { title: "Review with team", completed: false },
    ],
  },
  {
    title: "Go for a 30-minute run",
    date: new Date(),
    time: "08:00",
    deadline: new Date(),
    dateAdded: new Date(Date.now() - 86400000), // Yesterday
    completed: false,
    priority: "medium",
    location: "Park",
    why: "Maintaining my health is essential for long-term productivity",
    subTasks: [
      { title: "Prepare running clothes", completed: true },
      { title: "Fill water bottle", completed: false },
    ],
  },
  {
    title: "Read 20 pages of book",
    date: new Date(),
    time: "20:00",
    deadline: new Date(),
    dateAdded: new Date(Date.now() - 172800000), // 2 days ago
    completed: true,
    priority: "low",
    why: "Reading helps me learn and grow",
  },
]

async function main() {
  try {
    // Clean existing data
    console.log('Cleaning existing data...')
    await prisma.subTask.deleteMany()
    await prisma.task.deleteMany()
    await prisma.settings.deleteMany()
    await prisma.user.deleteMany()
    console.log('Data cleaned successfully')

    // Create a user
    const user = await prisma.user.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        bio: "I'm focused on improving my productivity and completing my goals.",
        principles: [
          "The best way to predict the future is to create it.",
          "Small actions compound into remarkable results.",
          "Focus on systems, not goals.",
          "What gets measured gets managed.",
        ],
        inspirations: [],
        // Create settings for the user
        settings: {
          create: {
            theme: "system",
            pomodoroDuration: "25",
            shortBreakDuration: "5",
            longBreakDuration: "15",
            soundEnabled: true,
            notificationsEnabled: true,
            emailNotifications: false,
            reminderTime: "30",
          }
        },
        // Create tasks for the user
        tasks: {
          create: sampleTasks.map(task => {
            const { subTasks, ...taskData } = task
            return {
              ...taskData,
              subTasks: {
                create: subTasks || []
              }
            }
          })
        }
      }
    })

    console.log('Database seeded successfully!')
    console.log('Created user:', user.name)
    console.log('User ID:', user.id)
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}) 