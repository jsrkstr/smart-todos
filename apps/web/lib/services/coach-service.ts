import { prisma } from "@/lib/db";

// Define Coach interface matching the Prisma schema
interface Coach {
  id: string;
  name: string;
  title?: string | null;
  image?: string | null;
  description?: string | null;
  style?: string | null;
  type: string;
  matchScore?: number | null;
  sampleQuotes: string[];
  principles: string[];
  createdAt: Date;
  updatedAt: Date;
  directness?: number | null;
  encouragementLevel?: number | null;
  coachingStyle?: string | null;
  isActive: boolean;
  createdBy?: string | null;
}

// Initial system coaches based on design
export const INITIAL_COACHES = [
  {
    name: "Steve",
    title: "The Innovator",
    description: "Pushes you to think differently and challenges conventional approaches.",
    style: "Challenging",
    type: "system",
    matchScore: 87,
    sampleQuotes: [
      "Stay hungry. Stay foolish. Push beyond what you think is possible.",
      "I see you're struggling with this task. Let's break it down into smaller components and tackle them one by one.",
      "You've been making great progress! You've completed 7 tasks today, which is 30% more than your average."
    ],
    directness: 80,
    encouragementLevel: 60,
    coachingStyle: "analytical",
    principles: [],
    isActive: true
  },
  {
    name: "Marie",
    title: "The Scientist",
    description: "Methodical and process-oriented approach with analytical feedback.",
    style: "Analytical",
    type: "system",
    matchScore: 92,
    sampleQuotes: [
      "Break down each problem into its smallest components for clarity.",
      "Let's analyze where you're spending the most time and optimize your process.",
      "The data suggests you're most productive in the morning. Let's schedule your important tasks then."
    ],
    directness: 65,
    encouragementLevel: 50,
    coachingStyle: "analytical",
    principles: [],
    isActive: true
  },
  {
    name: "Marcus",
    title: "The Philosopher",
    description: "Focuses on mindfulness and purpose in your daily tasks.",
    style: "Reflective",
    type: "system",
    matchScore: 81,
    sampleQuotes: [
      "The obstacle is the way. What stands in the way becomes the way.",
      "Focus on what you can control, let go of the rest.",
      "How does this task align with your values and long-term purpose?"
    ],
    directness: 40,
    encouragementLevel: 70,
    coachingStyle: "reflective",
    principles: [],
    isActive: true
  },
  {
    name: "Grace",
    title: "The Engineer",
    description: "Structured and systematic approach to problem-solving.",
    style: "Structured",
    type: "system",
    matchScore: 78,
    sampleQuotes: [
      "Always have a plan, but be ready to debug and iterate when needed.",
      "Let's build a process that makes this repeatable and efficient.",
      "Every complex problem can be broken down into manageable pieces."
    ],
    directness: 60,
    encouragementLevel: 55,
    coachingStyle: "balanced",
    principles: [],
    isActive: true
  },
  {
    name: "Alex",
    title: "The Olympian",
    description: "High-energy motivator focused on personal bests and incremental gains.",
    style: "Motivational",
    type: "system",
    matchScore: 89,
    sampleQuotes: [
      "Progress happens when you push just slightly beyond your comfort zone.",
      "Small wins compound into major victories over time.",
      "You've got this! Remember how far you've already come."
    ],
    directness: 75,
    encouragementLevel: 90,
    coachingStyle: "motivational",
    principles: [],
    isActive: true
  },
];

// Define more specific return types
type SeedResult = { success: boolean; coaches?: Coach[]; error?: any };

export async function seedSystemCoaches(): Promise<SeedResult> {
  try {
    // Use simpler query for checking if coaches exist
    const existingCoaches = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Coach" WHERE type = 'system'
    `;

    // Check if we already have system coaches
    const count = Number((existingCoaches as any[])[0]?.count || 0);
    
    if (count > 0) {
      console.log("System coaches already seeded.");
      return { success: true };
    }

    console.log("Seeding system coaches...");
    
    const createdCoaches: Coach[] = [];
    
    // Use parameterized queries for each coach insertion
    for (const coach of INITIAL_COACHES) {
      // First insert the coach with basic fields
      await prisma.$executeRaw`
        INSERT INTO "Coach" (
          name, title, description, style, type, "matchScore",
          directness, "encouragementLevel", "coachingStyle", "isActive", 
          "createdAt", "updatedAt"
        ) VALUES (
          ${coach.name}, 
          ${coach.title}, 
          ${coach.description}, 
          ${coach.style}, 
          ${coach.type}, 
          ${coach.matchScore}, 
          ${coach.directness}, 
          ${coach.encouragementLevel}, 
          ${coach.coachingStyle}, 
          TRUE,
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
      `;
      
      // Then fetch the created coach to add to our result
      const newCoaches = await prisma.$queryRaw`
        SELECT * FROM "Coach" WHERE name = ${coach.name} AND type = 'system'
      `;
      
      if ((newCoaches as any[]).length > 0) {
        createdCoaches.push((newCoaches as any[])[0] as Coach);
      }
      
      // Now update the coach with JSON fields in a separate query
      if ((newCoaches as any[]).length > 0) {
        const coachId = (newCoaches as any[])[0].id;
        await prisma.$executeRaw`
          UPDATE "Coach" SET
          "sampleQuotes" = ${JSON.stringify(coach.sampleQuotes)}::jsonb,
          "principles" = ${JSON.stringify(coach.principles)}::jsonb
          WHERE id = ${coachId}
        `;
      }
    }
    
    console.log(`Created ${createdCoaches.length} system coaches`);
    return { success: true, coaches: createdCoaches };
  } catch (error) {
    console.error("Error seeding system coaches:", error);
    return { success: false, error };
  }
}

export async function getAllCoaches() {
  try {
    const result = await prisma.$queryRaw`SELECT * FROM "Coach" WHERE "isActive" = true ORDER BY "createdAt" ASC`;
    return result as Coach[];
  } catch (error) {
    console.error("Error getting all coaches:", error);
    return [];
  }
}

export async function getCoachById(id: string) {
  try {
    const coaches = await prisma.$queryRaw`SELECT * FROM "Coach" WHERE id = ${id}`;
    return (coaches as any[])[0] as Coach || null;
  } catch (error) {
    console.error("Error getting coach by ID:", error);
    return null;
  }
}

export async function getUserCoaches(userId: string) {
  try {
    const result = await prisma.$queryRaw`
      SELECT * FROM "Coach" 
      WHERE (type = 'system' OR "createdBy" = ${userId})
      AND "isActive" = true
      ORDER BY "createdAt" ASC
    `;
    return result as Coach[];
  } catch (error) {
    console.error("Error getting user coaches:", error);
    return [];
  }
}

export async function createCustomCoach(data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Extract the keys and values
    const { name, title, description, style, directness, encouragementLevel, 
            coachingStyle, sampleQuotes = [], principles = [] } = data;
    
    // Use direct parameters instead of dynamic construction
    const result = await prisma.$executeRaw`
      INSERT INTO "Coach" (
        name, title, description, style, type, 
        directness, "encouragementLevel", "coachingStyle", 
        "sampleQuotes", principles, "isActive", "createdAt", "updatedAt", "createdBy"
      ) 
      VALUES (
        ${name}, ${title}, ${description}, ${style}, 'custom',
        ${directness}, ${encouragementLevel}, ${coachingStyle},
        ${JSON.stringify(sampleQuotes)}::jsonb, ${JSON.stringify(principles)}::jsonb,
        TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${data.createdBy}
      )
      RETURNING *
    `;
    
    // Fetch the newly created coach
    const coaches = await prisma.$queryRaw`
      SELECT * FROM "Coach" WHERE name = ${name} AND "createdBy" = ${data.createdBy}
      ORDER BY "createdAt" DESC LIMIT 1
    `;
    
    return (coaches as any[])[0] as Coach;
  } catch (error) {
    console.error("Error creating custom coach:", error);
    throw error;
  }
}

export async function updateUserCoach(userId: string, coachId: string) {
  try {
    // Check if profile exists
    const profiles = await prisma.$queryRaw`
      SELECT * FROM "PsychProfile" WHERE "userId" = ${userId}
    `;
    
    const profileExists = (profiles as any[]).length > 0;

    if (profileExists) {
      await prisma.$executeRaw`
        UPDATE "PsychProfile"
        SET "coachId" = ${coachId}, "selectedCoach" = ${coachId}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "userId" = ${userId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "PsychProfile" 
        ("userId", "coachId", "selectedCoach", "productivityTime", "communicationPref", 
         "taskApproach", "difficultyPreference", "reminderTiming", "createdAt", "updatedAt")
        VALUES 
        (${userId}, ${coachId}, ${coachId}, 'morning', 'moderate', 
         'varied', 'alternate', 'just_in_time', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
    }
    
    // Return updated profile
    const updatedProfiles = await prisma.$queryRaw`
      SELECT * FROM "PsychProfile" WHERE "userId" = ${userId}
    `;
    
    return (updatedProfiles as any[])[0];
  } catch (error) {
    console.error("Error updating user coach:", error);
    throw error;
  }
}

export async function getUserCurrentCoach(userId: string) {
  try {
    const results = await prisma.$queryRaw`
      SELECT c.* FROM "Coach" c
      JOIN "PsychProfile" p ON c.id = p."coachId"
      WHERE p."userId" = ${userId}
    `;
    
    return (results as any[])[0] as Coach || null;
  } catch (error) {
    console.error("Error getting user current coach:", error);
    return null;
  }
} 