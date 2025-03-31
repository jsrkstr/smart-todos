import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { LogService } from './logService'
import { LogType, LogAuthor } from '@prisma/client'

interface UserProfileUpdateData {
  name?: string;
  email?: string;
  bio?: string;
  gender?: string;
  age?: number;
  principles?: string[];
  inspirations?: string[];
  image?: string;
}

interface PsychProfileData {
  productivityTime?: string;
  communicationPref?: string;
  taskApproach?: string;
  difficultyPreference?: string;
  coachId?: string | null;
}

export class ProfileService {
  /**
   * Get a user's profile including psychological profile
   */
  static async getUserProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        psychProfile: {
          include: {
            coach: true
          }
        }
      }
    });
  }

  /**
   * Update a user's profile
   */
  static async updateUserProfile(userId: string, data: UserProfileUpdateData) {
    // Log what's being updated
    const updateFields = Object.keys(data).filter(k => data[k as keyof UserProfileUpdateData] !== undefined);
    
    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    // Log profile update
    await LogService.createLog({
      type: LogType.profile_updated,
      userId,
      data: {
        updatedFields: updateFields,
      },
      author: LogAuthor.User
    });

    return user;
  }

  /**
   * Get a user's psychological profile
   */
  static async getPsychProfile(userId: string) {
    return prisma.psychProfile.findUnique({
      where: { userId },
      include: {
        coach: true
      }
    });
  }

  /**
   * Create or update a user's psychological profile
   */
  static async updatePsychProfile(userId: string, data: PsychProfileData) {
    const existingProfile = await prisma.psychProfile.findUnique({
      where: { userId }
    });

    let profile;
    const updateFields = Object.keys(data).filter(k => data[k as keyof PsychProfileData] !== undefined);

    if (existingProfile) {
      // Update existing profile
      profile = await prisma.psychProfile.update({
        where: { userId },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          coach: true
        }
      });
    } else {
      // Create new profile with defaults for required fields
      profile = await prisma.psychProfile.create({
        data: {
          userId,
          productivityTime: data.productivityTime || 'morning',
          communicationPref: data.communicationPref || 'moderate',
          taskApproach: data.taskApproach || 'varied',
          difficultyPreference: data.difficultyPreference || 'alternate',
          coachId: data.coachId,
        },
        include: {
          coach: true
        }
      });
    }

    // Log psych profile update
    await LogService.createLog({
      type: LogType.profile_updated,
      userId,
      data: {
        updatedFields: updateFields,
        psychProfileUpdated: true
      },
      author: LogAuthor.User
    });

    return profile;
  }

  /**
   * Add a principle to the user's principles list
   */
  static async addPrinciple(userId: string, principle: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        principles: [...user.principles, principle],
      },
    });

    // Log principle added
    await LogService.createLog({
      type: LogType.profile_updated,
      userId,
      data: {
        principleAdded: principle
      },
      author: LogAuthor.User
    });

    return updatedUser;
  }

  /**
   * Remove a principle from the user's principles list
   */
  static async removePrinciple(userId: string, index: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (index < 0 || index >= user.principles.length) {
      throw new Error('Invalid principle index');
    }

    const removedPrinciple = user.principles[index];
    const updatedPrinciples = user.principles.filter((_, i) => i !== index);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        principles: updatedPrinciples,
      },
    });

    // Log principle removed
    await LogService.createLog({
      type: LogType.profile_updated,
      userId,
      data: {
        principleRemoved: removedPrinciple
      },
      author: LogAuthor.User
    });

    return updatedUser;
  }

  /**
   * Add an inspiration to the user's inspirations list
   */
  static async addInspiration(userId: string, inspiration: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        inspirations: [...user.inspirations, inspiration],
      },
    });

    // Log inspiration added
    await LogService.createLog({
      type: LogType.profile_updated,
      userId,
      data: {
        inspirationAdded: inspiration
      },
      author: LogAuthor.User
    });

    return updatedUser;
  }

  /**
   * Remove an inspiration from the user's inspirations list
   */
  static async removeInspiration(userId: string, index: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (index < 0 || index >= user.inspirations.length) {
      throw new Error('Invalid inspiration index');
    }

    const removedInspiration = user.inspirations[index];
    const updatedInspirations = user.inspirations.filter((_, i) => i !== index);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        inspirations: updatedInspirations,
      },
    });

    // Log inspiration removed
    await LogService.createLog({
      type: LogType.profile_updated,
      userId,
      data: {
        inspirationRemoved: removedInspiration
      },
      author: LogAuthor.User
    });

    return updatedUser;
  }

  /**
   * Update a user's profile and psychological profile
   */
  static async updateFullProfile(userId: string, data: {
    userProfile?: UserProfileUpdateData;
    psychProfile?: PsychProfileData;
  }) {
    const { userProfile, psychProfile } = data;
    
    // Initialize variables
    let user;
    let profile;
    
    // Update user profile if data provided
    if (userProfile && Object.keys(userProfile).length > 0) {
      user = await prisma.user.update({
        where: { id: userId },
        data: userProfile,
        include: {
          psychProfile: {
            include: {
              coach: true,
            }
          },
        }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          psychProfile: {
            include: {
              coach: true,
            }
          },
        }
      });
    }

    if (!user) {
      throw new Error('User not found');
    }
    
    // Handle psychological profile if present
    if (psychProfile && Object.keys(psychProfile).length > 0) {
      if (user.psychProfile) {
        // Update existing profile
        profile = await prisma.psychProfile.update({
          where: { userId },
          data: {
            ...psychProfile,
            updatedAt: new Date(),
          },
          include: {
            coach: true
          }
        });
      } else {
        // Create new profile
        profile = await prisma.psychProfile.create({
          data: {
            userId,
            productivityTime: psychProfile.productivityTime || 'morning',
            communicationPref: psychProfile.communicationPref || 'moderate',
            taskApproach: psychProfile.taskApproach || 'varied',
            difficultyPreference: psychProfile.difficultyPreference || 'alternate',
            coachId: psychProfile.coachId,
          },
          include: {
            coach: true
          }
        });
      }
    } else {
      profile = user.psychProfile;
    }

    // Log the profile update
    await LogService.createLog({
      type: LogType.profile_updated,
      userId,
      data: {
        userProfileUpdated: userProfile ? Object.keys(userProfile) : [],
        psychProfileUpdated: psychProfile ? Object.keys(psychProfile) : []
      },
      author: LogAuthor.User
    });
    
    return { user, psychProfile: profile };
  }
} 