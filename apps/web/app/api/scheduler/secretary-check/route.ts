import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createMorningBriefingService } from '@/lib/secretary/morning-briefing';
import { createProactiveOutreachService } from '@/lib/secretary/proactive-outreach';
import { createSecretaryStateService } from '@smart-todos/agent';

/**
 * Secretary Check Scheduler
 *
 * Runs periodically to:
 * 1. Send morning briefings to users at their preferred time
 * 2. Execute proactive outreach for inactive users or pending follow-ups
 * 3. Update secretary state
 *
 * Should be called by a cron job every 15-30 minutes
 */
export async function GET(req: Request) {
  try {
    console.log('[SecretaryCheck] Starting secretary check run...');

    const results = {
      briefingsSent: 0,
      outreachSent: 0,
      opportunitiesFound: 0,
      errors: [] as string[],
    };

    // Get current hour
    const currentHour = new Date().getHours();

    // 1. Check for morning briefings
    await sendMorningBriefings(currentHour, results);

    // 2. Execute proactive outreach
    await executeProactiveOutreach(results);

    console.log('[SecretaryCheck] Completed secretary check:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('[SecretaryCheck] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run secretary check',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Send morning briefings to users
 */
async function sendMorningBriefings(
  currentHour: number,
  results: { briefingsSent: number; errors: string[] }
): Promise<void> {
  try {
    // Find users whose briefing time is now
    const users = await prisma.user.findMany({
      where: {
        settings: {
          notificationsEnabled: true,
        },
      },
      include: {
        settings: true,
        secretaryState: true,
      },
    });

    const briefingService = createMorningBriefingService(prisma);
    const secretaryStateService = createSecretaryStateService(prisma);

    for (const user of users) {
      try {
        // Check if briefing should be sent
        const preferredHour = user.settings?.briefingHour || 8;

        // Send briefing within 1 hour of preferred time
        if (currentHour >= preferredHour && currentHour < preferredHour + 2) {
          // Check if briefing already sent today
          const state = await secretaryStateService.getState(user.id);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (state.lastBriefing && state.lastBriefing >= today) {
            // Already sent today
            continue;
          }

          // Generate and send briefing
          console.log(`[SecretaryCheck] Sending morning briefing to user ${user.id}`);

          const briefingContent = await briefingService.generateBriefing(user.id);

          // Save as chat message
          await prisma.chatMessage.create({
            data: {
              userId: user.id,
              content: briefingContent,
              role: 'assistant',
              type: 'Info',
            },
          });

          // Update secretary state
          await prisma.secretaryState.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              lastBriefing: new Date(),
              lastInteraction: new Date(),
              interactionCount: 1,
              currentMode: 'briefing',
              pendingFollowUps: [],
              conversationMemory: {
                recentTopics: ['morning_briefing'],
                unresolvedQuestions: [],
                celebratedMilestones: [],
                lastSentiment: 'neutral',
                relationshipStage: 'new',
              },
            },
            update: {
              lastBriefing: new Date(),
              lastInteraction: new Date(),
              interactionCount: { increment: 1 },
              currentMode: 'briefing',
              conversationMemory: {
                ...((state.conversationMemory as any) || {}),
                recentTopics: [
                  'morning_briefing',
                  ...((state.conversationMemory as any)?.recentTopics?.slice(0, 4) || []),
                ],
              },
            },
          });

          // Send push notification if available
          if (user.expoPushToken) {
            await sendPushNotification(
              user.expoPushToken,
              'Good morning!',
              'Your daily briefing is ready'
            );
          }

          results.briefingsSent++;
        }
      } catch (error) {
        console.error(`[SecretaryCheck] Error sending briefing to user ${user.id}:`, error);
        results.errors.push(
          `Briefing error for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    console.error('[SecretaryCheck] Error in sendMorningBriefings:', error);
    results.errors.push(
      `Briefing batch error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Execute proactive outreach
 */
async function executeProactiveOutreach(results: {
  outreachSent: number;
  opportunitiesFound: number;
  errors: string[];
}): Promise<void> {
  try {
    const outreachService = createProactiveOutreachService(prisma);

    // Find all outreach opportunities
    const opportunities = await outreachService.findOutreachOpportunities();
    results.opportunitiesFound = opportunities.length;

    console.log(`[SecretaryCheck] Found ${opportunities.length} outreach opportunities`);

    // Execute top 10 opportunities (don't overwhelm users)
    const topOpportunities = opportunities.slice(0, 10);

    for (const opportunity of topOpportunities) {
      try {
        console.log(
          `[SecretaryCheck] Executing outreach for user ${opportunity.userId}: ${opportunity.reason}`
        );

        const success = await outreachService.executeOutreach(opportunity);

        if (success) {
          results.outreachSent++;
        }
      } catch (error) {
        console.error(
          `[SecretaryCheck] Error executing outreach for user ${opportunity.userId}:`,
          error
        );
        results.errors.push(
          `Outreach error for user ${opportunity.userId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    console.error('[SecretaryCheck] Error in executeProactiveOutreach:', error);
    results.errors.push(
      `Outreach batch error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Send push notification
 */
async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default' as const,
      title,
      body,
      data: {
        type: 'secretary_briefing',
      },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('[SecretaryCheck] Failed to send push notification:', error);
  }
}
