import { PrismaClient, TaskStatus, ReminderTimeOption } from '@prisma/client'

const prisma = new PrismaClient()

const coaches = [
  {
    name: "Marie",
    title: "Motivational Coach",
    image: "/coaches/marie.jpg",
    description: "Marie helps you stay motivated with positive reinforcement and practical strategies.",
    style: "balanced",
    type: "system",
    matchScore: 85,
    sampleQuotes: [
      "Small steps lead to big results. Let's focus on progress, not perfection.",
      "You've got this! Remember why you started.",
      "Every accomplishment starts with the decision to try."
    ],
    principles: [
      "Positive reinforcement",
      "Progress over perfection",
      "Sustainable habits"
    ],
    directness: 60,
    encouragementLevel: 80,
    coachingStyle: "motivational",
    isActive: true
  },
  {
    name: "David",
    title: "Analytical Coach",
    image: "/coaches/david.jpg",
    description: "David focuses on data-driven productivity and strategic planning.",
    style: "analytical",
    type: "system",
    matchScore: 75,
    sampleQuotes: [
      "Let's analyze what's working and optimize your approach.",
      "The data suggests that changing this habit would improve your results.",
      "Clear metrics lead to better decisions."
    ],
    principles: [
      "Data-driven decisions",
      "Systematic approach",
      "Continuous optimization"
    ],
    directness: 80,
    encouragementLevel: 50,
    coachingStyle: "analytical",
    isActive: true
  },
  {
    name: "Sophia",
    title: "Mindfulness Coach",
    image: "/coaches/sophia.jpg",
    description: "Sophia helps you balance productivity with well-being through mindful approaches.",
    style: "reflective",
    type: "system",
    matchScore: 70,
    sampleQuotes: [
      "Take a moment to breathe and reconnect with your purpose.",
      "How does this task align with your core values?",
      "Balance is not something you find, it's something you create."
    ],
    principles: [
      "Mindful productivity",
      "Value-based decisions",
      "Work-life harmony"
    ],
    directness: 40,
    encouragementLevel: 70,
    coachingStyle: "reflective",
    isActive: true
  }
]

const sampleTasks = [
  {
    title: "Complete project proposal",
    date: new Date(),
    time: "14:00",
    deadline: new Date(Date.now() + 86400000), // Tomorrow
    dateAdded: new Date(),
    status: TaskStatus.planned,
    priority: "high",
    location: "Office",
    estimatedTimeMinutes: 120,
    why: "This will help advance my career and demonstrate my skills",
    subTasks: [
      { title: "Research competitors", status: TaskStatus.completed, position: 0 },
      { title: "Create outline", status: TaskStatus.completed, position: 1 },
      { title: "Write first draft", status: TaskStatus.new, position: 2 },
      { title: "Review with team", status: TaskStatus.new, position: 3 },
    ],
  },
  {
    title: "Go for a 30-minute run",
    date: new Date(),
    time: "08:00",
    deadline: new Date(),
    dateAdded: new Date(Date.now() - 86400000), // Yesterday
    status: TaskStatus.new,
    priority: "medium",
    location: "Park",
    estimatedTimeMinutes: 30,
    reminderTime: ReminderTimeOption.thirty_minutes,
    why: "Maintaining my health is essential for long-term productivity",
    subTasks: [
      { title: "Prepare running clothes", status: TaskStatus.completed, position: 0 },
      { title: "Fill water bottle", status: TaskStatus.new, position: 1 },
    ],
  },
  {
    title: "Read 20 pages of book",
    date: new Date(),
    time: "20:00",
    deadline: new Date(),
    dateAdded: new Date(Date.now() - 172800000), // 2 days ago
    status: TaskStatus.completed,
    priority: "low",
    estimatedTimeMinutes: 30,
    why: "Reading helps me learn and grow",
    subTasks: [],
  },
]

async function main() {
  try {
    // Clean existing data
    console.log('Cleaning existing data...')
    await prisma.subTask.deleteMany()
    await prisma.task.deleteMany()
    await prisma.settings.deleteMany()
    await prisma.psychProfile.deleteMany()
    await prisma.coach.deleteMany()
    await prisma.user.deleteMany()
    console.log('Data cleaned successfully')

    // Seed coaches
    console.log('Seeding coaches...')
    const createdCoaches = await Promise.all(
      coaches.map(coach => 
        prisma.coach.create({
          data: coach
        })
      )
    )
    console.log(`Created ${createdCoaches.length} coaches`)

    // Get the default coach (Marie)
    const defaultCoach = createdCoaches[0]

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
            notifications: true,
            emailNotifications: false,
            timezone: "UTC",
            language: "en",
          }
        },
        // Create psych profile with coach selection
        psychProfile: {
          create: {
            productivityTime: "morning",
            communicationPref: "moderate",
            taskApproach: "sequential",
            difficultyPreference: "first",
            reminderTiming: "thirty_minutes",
            selectedCoach: defaultCoach.name,
            coachId: defaultCoach.id
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
    console.log('Selected coach:', defaultCoach.name)
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