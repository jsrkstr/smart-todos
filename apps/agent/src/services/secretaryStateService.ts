import { PrismaClient } from '@prisma/client';

/**
 * Secretary State - Tracks secretary-specific interaction state
 */
export interface SecretaryState {
  userId: string;
  lastInteraction: Date | null;
  lastBriefing: Date | null;
  interactionCount: number;
  currentMode: 'proactive' | 'reactive' | 'briefing' | 'coaching';
  pendingFollowUps: FollowUp[];
  conversationMemory: ConversationMemory;
  updatedAt: Date;
}

/**
 * Follow-up item that needs checking
 */
export interface FollowUp {
  id: string;
  taskId: string;
  type: 'blocked' | 'overdue' | 'check_progress' | 'celebration';
  reason: string;
  scheduledFor: Date;
  createdAt: Date;
  resolved: boolean;
}

/**
 * Conversation memory for continuity
 */
export interface ConversationMemory {
  recentTopics: string[]; // Last 5 topics discussed
  unresolvedQuestions: Array<{
    question: string;
    askedAt: Date;
    context: string;
  }>;
  celebratedMilestones: string[]; // To avoid duplicate celebrations
  lastSentiment: 'positive' | 'neutral' | 'negative' | 'frustrated';
  relationshipStage: 'new' | 'building' | 'established' | 'trusted';
}

/**
 * Secretary State Service
 *
 * Manages secretary-specific state for proactive outreach and follow-ups
 */
export class SecretaryStateService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get or initialize secretary state for user
   */
  async getState(userId: string): Promise<SecretaryState> {
    // Check if state exists in database
    const record = await this.prisma.secretaryState.findUnique({
      where: { userId },
    });

    if (record) {
      return {
        userId: record.userId,
        lastInteraction: record.lastInteraction,
        lastBriefing: record.lastBriefing,
        interactionCount: record.interactionCount,
        currentMode: record.currentMode as any,
        pendingFollowUps: (record.pendingFollowUps as any) || [],
        conversationMemory: (record.conversationMemory as any) || this.getEmptyMemory(),
        updatedAt: record.updatedAt,
      };
    }

    // Initialize new state
    const newState: SecretaryState = {
      userId,
      lastInteraction: null,
      lastBriefing: null,
      interactionCount: 0,
      currentMode: 'reactive',
      pendingFollowUps: [],
      conversationMemory: this.getEmptyMemory(),
      updatedAt: new Date(),
    };

    await this.saveState(newState);
    return newState;
  }

  /**
   * Update secretary state
   */
  async saveState(state: SecretaryState): Promise<void> {
    await this.prisma.secretaryState.upsert({
      where: { userId: state.userId },
      create: {
        userId: state.userId,
        lastInteraction: state.lastInteraction,
        lastBriefing: state.lastBriefing,
        interactionCount: state.interactionCount,
        currentMode: state.currentMode,
        pendingFollowUps: state.pendingFollowUps as any,
        conversationMemory: state.conversationMemory as any,
        updatedAt: new Date(),
      },
      update: {
        lastInteraction: state.lastInteraction,
        lastBriefing: state.lastBriefing,
        interactionCount: state.interactionCount,
        currentMode: state.currentMode,
        pendingFollowUps: state.pendingFollowUps as any,
        conversationMemory: state.conversationMemory as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Record an interaction
   */
  async recordInteraction(userId: string, topic?: string): Promise<void> {
    const state = await this.getState(userId);
    state.lastInteraction = new Date();
    state.interactionCount++;

    if (topic) {
      state.conversationMemory.recentTopics.unshift(topic);
      state.conversationMemory.recentTopics = state.conversationMemory.recentTopics.slice(0, 5);
    }

    await this.saveState(state);
  }

  /**
   * Record a briefing was sent
   */
  async recordBriefing(userId: string): Promise<void> {
    const state = await this.getState(userId);
    state.lastBriefing = new Date();
    state.currentMode = 'briefing';
    await this.saveState(state);
  }

  /**
   * Add a follow-up item
   */
  async addFollowUp(
    userId: string,
    taskId: string,
    type: FollowUp['type'],
    reason: string,
    scheduledFor: Date
  ): Promise<void> {
    const state = await this.getState(userId);

    const followUp: FollowUp = {
      id: `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      type,
      reason,
      scheduledFor,
      createdAt: new Date(),
      resolved: false,
    };

    state.pendingFollowUps.push(followUp);
    await this.saveState(state);
  }

  /**
   * Get pending follow-ups that are due
   */
  async getPendingFollowUps(userId: string): Promise<FollowUp[]> {
    const state = await this.getState(userId);
    const now = new Date();

    return state.pendingFollowUps.filter(
      (f) => !f.resolved && f.scheduledFor <= now
    );
  }

  /**
   * Mark follow-up as resolved
   */
  async resolveFollowUp(userId: string, followUpId: string): Promise<void> {
    const state = await this.getState(userId);
    const followUp = state.pendingFollowUps.find((f) => f.id === followUpId);

    if (followUp) {
      followUp.resolved = true;
      await this.saveState(state);
    }
  }

  /**
   * Add unresolved question for follow-up
   */
  async addUnresolvedQuestion(
    userId: string,
    question: string,
    context: string
  ): Promise<void> {
    const state = await this.getState(userId);

    state.conversationMemory.unresolvedQuestions.push({
      question,
      askedAt: new Date(),
      context,
    });

    // Keep only last 3 unresolved questions
    state.conversationMemory.unresolvedQuestions =
      state.conversationMemory.unresolvedQuestions.slice(-3);

    await this.saveState(state);
  }

  /**
   * Clear unresolved questions (when answered)
   */
  async clearUnresolvedQuestions(userId: string): Promise<void> {
    const state = await this.getState(userId);
    state.conversationMemory.unresolvedQuestions = [];
    await this.saveState(state);
  }

  /**
   * Update sentiment based on recent interaction
   */
  async updateSentiment(
    userId: string,
    sentiment: ConversationMemory['lastSentiment']
  ): Promise<void> {
    const state = await this.getState(userId);
    state.conversationMemory.lastSentiment = sentiment;

    // Update relationship stage based on interaction count
    if (state.interactionCount < 5) {
      state.conversationMemory.relationshipStage = 'new';
    } else if (state.interactionCount < 20) {
      state.conversationMemory.relationshipStage = 'building';
    } else if (state.interactionCount < 50) {
      state.conversationMemory.relationshipStage = 'established';
    } else {
      state.conversationMemory.relationshipStage = 'trusted';
    }

    await this.saveState(state);
  }

  /**
   * Add celebrated milestone to avoid duplicates
   */
  async celebrateMilestone(userId: string, milestone: string): Promise<void> {
    const state = await this.getState(userId);

    if (!state.conversationMemory.celebratedMilestones.includes(milestone)) {
      state.conversationMemory.celebratedMilestones.push(milestone);
      await this.saveState(state);
    }
  }

  /**
   * Check if milestone was already celebrated
   */
  async wasMilestoneCelebrated(userId: string, milestone: string): Promise<boolean> {
    const state = await this.getState(userId);
    return state.conversationMemory.celebratedMilestones.includes(milestone);
  }

  /**
   * Get empty conversation memory
   */
  private getEmptyMemory(): ConversationMemory {
    return {
      recentTopics: [],
      unresolvedQuestions: [],
      celebratedMilestones: [],
      lastSentiment: 'neutral',
      relationshipStage: 'new',
    };
  }

  /**
   * Check if morning briefing is due
   */
  async isBriefingDue(userId: string): Promise<boolean> {
    const state = await this.getState(userId);

    if (!state.lastBriefing) {
      return true; // Never sent briefing
    }

    const lastBriefingDate = new Date(state.lastBriefing);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastBriefingDate.setHours(0, 0, 0, 0);

    // Briefing due if last one was yesterday or earlier
    return lastBriefingDate < today;
  }

  /**
   * Check if proactive outreach is needed
   */
  async shouldReachOut(userId: string): Promise<{ should: boolean; reason: string }> {
    const state = await this.getState(userId);
    const now = new Date();

    // Check if user hasn't interacted in 3+ days
    if (state.lastInteraction) {
      const daysSinceInteraction =
        (now.getTime() - state.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceInteraction >= 3) {
        return {
          should: true,
          reason: `Haven't heard from you in ${Math.floor(daysSinceInteraction)} days`,
        };
      }
    }

    // Check for pending follow-ups
    const pendingFollowUps = await this.getPendingFollowUps(userId);
    if (pendingFollowUps.length > 0) {
      return {
        should: true,
        reason: `${pendingFollowUps.length} follow-up${pendingFollowUps.length > 1 ? 's' : ''} due`,
      };
    }

    // Check for unresolved questions from >24 hours ago
    const oldQuestions = state.conversationMemory.unresolvedQuestions.filter(
      (q) => now.getTime() - q.askedAt.getTime() > 24 * 60 * 60 * 1000
    );

    if (oldQuestions.length > 0) {
      return {
        should: true,
        reason: 'Unresolved questions from previous conversations',
      };
    }

    return { should: false, reason: '' };
  }
}

/**
 * Factory function
 */
export function createSecretaryStateService(prisma: PrismaClient): SecretaryStateService {
  return new SecretaryStateService(prisma);
}
