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
    // Check if system coaches already exist
    const existingCoachCount = await prisma.coach.count({
      where: {
        type: 'system'
      }
    });

    // Check if we already have system coaches
    if (existingCoachCount > 0) {
      console.log("System coaches already seeded.");
      return { success: true };
    }

    console.log("Seeding system coaches...");
    
    const createdCoaches: Coach[] = [];
    
    // Use Prisma's createMany to insert all coaches at once
    for (const coach of INITIAL_COACHES) {
      // Create a coach with all fields at once
      const newCoach = await prisma.coach.create({
        data: {
          name: coach.name,
          title: coach.title,
          description: coach.description,
          style: coach.style,
          type: coach.type,
          matchScore: coach.matchScore,
          directness: coach.directness,
          encouragementLevel: coach.encouragementLevel,
          coachingStyle: coach.coachingStyle,
          isActive: true,
          sampleQuotes: coach.sampleQuotes,
          principles: coach.principles || []
        }
      });
      
      createdCoaches.push(newCoach as Coach);
    }
    
    console.log(`Created ${createdCoaches.length} system coaches`);
    return { success: true, coaches: createdCoaches };
  } catch (error) {
    console.error("Error seeding system coaches:", error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error };
  }
}

export async function getAllCoaches() {
  try {
    const result = await prisma.coach.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    return result as Coach[];
  } catch (error) {
    console.error("Error getting all coaches:", error);
    return [];
  }
}

export async function getCoachById(id: string) {
  try {
    const coach = await prisma.coach.findUnique({
      where: {
        id: id
      }
    });
    return coach as Coach || null;
  } catch (error) {
    console.error("Error getting coach by ID:", error);
    return null;
  }
}

export async function getUserCoaches(userId: string) {
  try {
    const result = await prisma.coach.findMany({
      where: {
        AND: [
          {
            OR: [
              { type: 'system' },
              { createdBy: userId }
            ]
          },
          { isActive: true }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    return result as Coach[];
  } catch (error) {
    console.error("Error getting user coaches:", error);
    return [];
  }
}

export async function createCustomCoach(data: Omit<Coach, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Ensure we have valid values and defaults for optional fields
    const coachData = {
      name: data.name,
      title: data.title || null,
      description: data.description || null,
      style: data.style || null,
      type: 'custom',
      matchScore: null,
      sampleQuotes: Array.isArray(data.sampleQuotes) ? data.sampleQuotes : [],
      principles: Array.isArray(data.principles) ? data.principles : [],
      directness: data.directness || 50,
      encouragementLevel: data.encouragementLevel || 50,
      coachingStyle: data.coachingStyle || 'balanced',
      isActive: true,
      createdBy: data.createdBy || null
    };
    
    // Use Prisma's create method instead of raw SQL
    const coach = await prisma.coach.create({
      data: coachData
    });
    
    return coach as Coach;
  } catch (error) {
    console.error("Error creating custom coach:", error);
    throw error;
  }
}

export async function updateUserCoach(userId: string, coachId: string) {
  try {
    // Check if profile exists
    const profile = await prisma.psychProfile.findUnique({
      where: {
        userId: userId
      }
    });
    
    let updatedProfile;
    
    if (profile) {
      // Update existing profile
      updatedProfile = await prisma.psychProfile.update({
        where: {
          userId: userId
        },
        data: {
          coachId: coachId,
          selectedCoach: coachId,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new profile
      updatedProfile = await prisma.psychProfile.create({
        data: {
          userId: userId,
          coachId: coachId,
          selectedCoach: coachId,
          productivityTime: 'morning',
          communicationPref: 'moderate',
          taskApproach: 'varied',
          difficultyPreference: 'alternate',
          reminderTiming: 'just_in_time'
        }
      });
    }
    
    return updatedProfile;
  } catch (error) {
    console.error("Error updating user coach:", error);
    throw error;
  }
}

export async function getUserCurrentCoach(userId: string) {
  try {
    // First get the user's profile to find their coach ID
    const profile = await prisma.psychProfile.findUnique({
      where: {
        userId: userId
      },
      select: {
        coachId: true
      }
    });
    
    if (!profile || !profile.coachId) {
      return null;
    }
    
    // Then fetch the coach by ID
    const coach = await prisma.coach.findUnique({
      where: {
        id: profile.coachId
      }
    });
    
    return coach as Coach || null;
  } catch (error) {
    console.error("Error getting user current coach:", error);
    return null;
  }
} 