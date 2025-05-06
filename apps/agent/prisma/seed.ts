import { PrismaClient, TaskStatus, ReminderTimeOption, TaskStage, TaskPriority } from '@prisma/client'

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

// Add tag categories
const tagCategories = [
  { name: "Work" },
  { name: "Personal" },
  { name: "Health" },
  { name: "Learning" },
  { name: "Finance" }
]

// Add tags with their categories
const tags = [
  { name: "Project", color: "#4F46E5", categoryName: "Work" },
  { name: "Meeting", color: "#0EA5E9", categoryName: "Work" },
  { name: "Deadline", color: "#DC2626", categoryName: "Work" },
  { name: "Email", color: "#2563EB", categoryName: "Work" },
  
  { name: "Family", color: "#EC4899", categoryName: "Personal" },
  { name: "Friends", color: "#8B5CF6", categoryName: "Personal" },
  { name: "Hobby", color: "#10B981", categoryName: "Personal" },
  { name: "Chores", color: "#6B7280", categoryName: "Personal" },
  
  { name: "Exercise", color: "#22C55E", categoryName: "Health" },
  { name: "Nutrition", color: "#EAB308", categoryName: "Health" },
  { name: "Doctor", color: "#EF4444", categoryName: "Health" },
  { name: "Meditation", color: "#3B82F6", categoryName: "Health" },
  
  { name: "Course", color: "#F97316", categoryName: "Learning" },
  { name: "Reading", color: "#8B5CF6", categoryName: "Learning" },
  { name: "Practice", color: "#06B6D4", categoryName: "Learning" },
  { name: "Research", color: "#0EA5E9", categoryName: "Learning" },
  
  { name: "Budget", color: "#64748B", categoryName: "Finance" },
  { name: "Investment", color: "#10B981", categoryName: "Finance" },
  { name: "Bills", color: "#EF4444", categoryName: "Finance" },
  { name: "Taxes", color: "#DC2626", categoryName: "Finance" }
]

const sampleTasks = [
  {
    title: "Complete project proposal",
    date: new Date(),
    time: "14:00",
    deadline: new Date(Date.now() + 86400000), // Tomorrow
    completed: false,
    stage: TaskStage.Refinement,
    priority: TaskPriority.high,
    location: "Office",
    estimatedTimeMinutes: 120,
    why: "This will help advance my career and demonstrate my skills",
    tagNames: ["Project", "Deadline"],
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
    completed: false,
    stage: TaskStage.Planning,
    priority: TaskPriority.medium,
    location: "Park",
    estimatedTimeMinutes: 30,
    reminderTime: ReminderTimeOption.thirty_min_before,
    why: "Maintaining my health is essential for long-term productivity",
    tagNames: ["Exercise", "Health"],
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
    completed: true,
    stage: TaskStage.Reflection,
    priority: TaskPriority.low,
    estimatedTimeMinutes: 30,
    why: "Reading helps me learn and grow",
    tagNames: ["Reading", "Learning"],
    subTasks: [],
  },
]

async function main() {
  try {
    // Clean existing data
    console.log('Cleaning existing data...')
    await prisma.$executeRawUnsafe('DELETE FROM "CalendarEvent";')
    await prisma.$executeRawUnsafe('DELETE FROM "CalendarConnection";')
    await prisma.pomodoro.deleteMany()
    await prisma.subTask.deleteMany()
    await prisma.task.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.tagCategory.deleteMany()
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

    // Create tag categories
    console.log('Creating tag categories...')
    const createdTagCategories = await Promise.all(
      tagCategories.map(category => 
        prisma.tagCategory.create({
          data: {
            name: category.name
          }
        })
      )
    )
    console.log(`Created ${createdTagCategories.length} tag categories`)

    // Create map of category names to IDs
    const categoryMap = new Map(
      createdTagCategories.map(category => [category.name, category.id])
    )

    // Create tags
    console.log('Creating tags...')
    const createdTags = await Promise.all(
      tags.map(tag => 
        prisma.tag.create({
          data: {
            name: tag.name,
            color: tag.color,
            categoryId: categoryMap.get(tag.categoryName)
          }
        })
      )
    )
    console.log(`Created ${createdTags.length} tags`)

    // Create a map of tag names to their IDs
    const tagMap = new Map(
      createdTags.map(tag => [tag.name, tag.id])
    )

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
            coachId: defaultCoach.id
          }
        },
        // Create tasks for the user
        tasks: {
          create: sampleTasks.map(task => {
            const { subTasks, tagNames, ...taskData } = task
            return {
              ...taskData,
              subTasks: {
                create: subTasks || []
              },
              tags: {
                connect: tagNames?.map(tagName => {
                    const tagId = tagMap.get(tagName);
                    // Only include tags that exist in our map
                    if (tagId) {
                      return { id: tagId };
                    }
                    return null;
                  })
                  .filter(Boolean) || [] // Filter out null values
              }
            }
          })
        }
      }
    })

    console.log('Created user:', user.name)
    console.log('User ID:', user.id)
    console.log('Selected coach:', defaultCoach.name)

    // Create calendar connections
    console.log('Creating calendar connections...')

    // Use direct SQL to create calendar connections
    await prisma.$executeRawUnsafe(`
      INSERT INTO "CalendarConnection" ("id", "userId", "provider", "name", "isActive", "calendarId", "lastSynced", "syncFrequency", "createdAt", "updatedAt")
      VALUES 
      ('google-cal-1', '${user.id}', 'google', 'Google Calendar', true, 'primary', NOW(), 'daily', NOW(), NOW()),
      ('system-cal-1', '${user.id}', 'custom', 'System Calendar', true, 'system', NOW(), 'daily', NOW(), NOW());
    `);

    console.log(`Created 2 calendar connections`)

    // Create dummy calendar events
    console.log('Creating dummy calendar events...')
    
    const eventTitles = [
      "Team Meeting",
      "Doctor's Appointment",
      "Project Deadline",
      "Lunch with Client",
      "Weekly Review",
      "Gym Session",
      "Conference Call",
      "Birthday Party",
      "Dentist Appointment",
      "Family Dinner"
    ]

    const locations = [
      "Conference Room A",
      "Medical Center",
      "Office",
      "Italian Restaurant",
      "Meeting Room B",
      "Fitness Center",
      "Zoom",
      "Dave's House",
      "Dental Clinic",
      "Home"
    ]

    const now = new Date()
    
    // Create 10 tasks for calendar events
    const calendarTasks = []
    
    for (let i = 0; i < 10; i++) {
      // Calculate time (first 5 in morning, next 5 in afternoon)
      const startTime = new Date(now.getTime() + (i + 1) * 86400000) // Starting from tomorrow
      
      if (i < 5) {
        startTime.setHours(9 + i, 0, 0, 0) // 9am, 10am, etc.
      } else {
        startTime.setHours(13 + (i - 5), 0, 0, 0) // 1pm, 2pm, etc.
      }
      
      const endTime = new Date(startTime.getTime())
      endTime.setHours(startTime.getHours() + 1) // 1 hour events
      
      // Create a task for each event
      const task = await prisma.task.create({
        data: {
          userId: user.id,
          title: eventTitles[i],
          date: startTime,
          time: `${startTime.getHours()}:00`,
          deadline: endTime,
          completed: false,
          priority: "medium",
          estimatedTimeMinutes: 60,
          location: locations[i]
        }
      })
      
      // Mark as calendar event
      await prisma.$executeRawUnsafe(`
        UPDATE "Task" SET "isCalendarEvent" = true WHERE "id" = '${task.id}'
      `)
      
      calendarTasks.push({ id: task.id, index: i })
    }
    
    // Insert all calendar events at once
    for (const task of calendarTasks) {
      const i = task.index
      const connectionId = i < 5 ? 'google-cal-1' : 'system-cal-1'
      const eventType = i < 5 ? 'google-event' : 'system-event'
      const eventIndex = i < 5 ? i + 1 : i - 4
      const eventId = `${eventType}-${eventIndex}`
      const title = eventTitles[i].replace(/'/g, "''")
      const description = `Description for ${title}`
      const location = locations[i].replace(/'/g, "''")
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO "CalendarEvent" (
          "id", "externalId", "title", "description", "location", 
          "startTime", "endTime", "allDay", "status", "lastModified", 
          "calendarConnectionId", "linkedTaskId", "createdAt", "updatedAt"
        ) 
        VALUES (
          '${eventId}', 
          '${eventId}', 
          '${title}', 
          '${description}',
          '${location}', 
          (SELECT "date" FROM "Task" WHERE "id" = '${task.id}'), 
          (SELECT "deadline" FROM "Task" WHERE "id" = '${task.id}'), 
          false, 
          'confirmed', 
          NOW(), 
          '${connectionId}', 
          '${task.id}', 
          NOW(), 
          NOW()
        )
      `)
    }

    console.log(`Created 10 calendar events`)
    console.log('Database seeded successfully!')
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