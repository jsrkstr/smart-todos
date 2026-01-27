import { StateGraph, Annotation, BaseStore, InMemoryStore, START, END, MessagesAnnotation, messagesStateReducer } from '@langchain/langgraph';
import { AgentType, ActionItem } from './types/index';
import { determineAgent } from './agents/supervisor';
import { processTaskCreation } from './agents/taskCreation';
import { processPlanning } from './agents/planning';
import { processExecutionCoach } from './agents/executionCoach';
import { processAdaptation } from './agents/adaptation';
import { processAnalytics } from './agents/analytics';
import { executeActions } from './utils/actions';
import { UserService, TaskService, prisma } from './services/database';
import { createHistoricalContextService } from './services/historicalContextService';
import { createPhysicalContextService } from './services/physicalContextService';
import { createExternalContextService } from './services/externalContextService';
import { createPatternAnalysisService } from './services/patternAnalysisService';
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from './utils/pg-store';
import { AIMessage, BaseMessage, HumanMessage, isHumanMessage, RemoveMessage } from '@langchain/core/messages';
import { createLLM } from './utils/llm';
import { StateAnnotation } from './types/index';

// Define all node names as a union type for type safety
// export type NodeNames =
//   | "__start__"
//   | "__end__"
//   | 'loadContext'
//   | 'determineAgent'
//   | 'taskCreationAgent'
//   | 'planningAgent'
//   | 'executionCoachAgent'
//   | 'adaptationAgent'
//   | 'analyticsAgent'
//   | 'executeActions'
//   | 'generateResponse';

// Create the main supervisor graph
export const createSupervisorGraph = async (databaseUrl?: string) => {
  // Use provided DATABASE_URL or fall back to environment variable
  const dbUrl = databaseUrl || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL must be provided or set as environment variable');
  }

  // Initialize PostgreSQL store for long-term memory
  const pg_store = new PostgresStore(dbUrl);
  await pg_store.initialize();

  // Initialize checkpointer for conversation state
  const checkpointer = PostgresSaver.fromConnString(
    dbUrl,
    {
      schema: "langgraph", // defaults to "public"
    }
  );

  // NOTE: you need to call .setup() the first time you're using your checkpointer
  await checkpointer.setup();

  // Initialize the graph with the state annotation
  const graphBuilder = new StateGraph(StateAnnotation);

  // Add nodes for each step in the workflow
  graphBuilder.addNode('loadContext', async (state: typeof StateAnnotation.State, ...args: any[]) => {
    // const store = args[0].store;
    // await store.put(['1', 'memories'], '132', { 'food_preference': 'pizza' })
    console.log('=== LOAD CONTEXT ===');
    console.log('userId:', state.userId);
    console.log('taskId from context:', state.context?.taskId);

    const updates: Partial<typeof StateAnnotation.State> = {};
    try {
      if (state.userId) {
        // Cache user profile - only load if not already in state
        if (!state.user) {
          const user = await UserService.getUserWithProfile(state.userId);
          // Fix type cast to match UserWithPsychProfile type
          updates.user = user as unknown as typeof StateAnnotation.State['user'];
          console.log('Loaded user:', user?.id);
        } else {
          console.log('Using cached user from state');
        }

        // Load all contexts in parallel for better performance
        const historicalContextService = createHistoricalContextService(prisma);
        const physicalContextService = createPhysicalContextService(prisma);
        const externalContextService = createExternalContextService(prisma);
        const patternAnalysisService = createPatternAnalysisService(prisma);

        // Parallel execution of all context services
        const [historicalContext, physicalContext, externalContext, behavioralPatterns] =
          await Promise.all([
            historicalContextService.loadHistoricalContext(state.userId),
            physicalContextService.loadPhysicalContext(state.userId),
            externalContextService.loadExternalContext(state.userId),
            patternAnalysisService.loadPatterns(state.userId).catch(async () => {
              console.log('No behavioral patterns available - computing now...');
              return await patternAnalysisService.computePatterns(state.userId);
            }),
          ]);

        updates.historicalContext = historicalContext;
        console.log('Loaded historical context:', {
          notificationsSentToday: historicalContext.notificationsSentToday,
          tasksCompletedToday: historicalContext.tasksCompletedToday,
          appOpenedToday: historicalContext.appOpenedToday,
        });

        updates.physicalContext = physicalContext;
        if (physicalContext) {
          console.log('Loaded physical context:', {
            activity: physicalContext.currentActivity,
            location: physicalContext.locationType,
            interruptible: physicalContextService.shouldAllowInterruption(physicalContext),
          });
        } else {
          console.log('No recent physical context available');
        }

        updates.externalContext = externalContext;
        if (externalContext && externalContext.hasCalendarConnected) {
          console.log('Loaded external context:', {
            eventsToday: externalContext.eventsToday.length,
            nextEvent: externalContext.nextEvent?.title,
            freeBlocks: externalContext.freeTimeBlocks.length,
          });
        } else {
          console.log('No calendar connected or no external context');
        }

        updates.behavioralPatterns = behavioralPatterns;
        if (behavioralPatterns) {
          console.log('Loaded behavioral patterns:', {
            confidence: behavioralPatterns.confidence.overall,
            mostProductiveHours: behavioralPatterns.mostProductiveHours,
            preferredTaskDuration: behavioralPatterns.preferredTaskDuration,
          });
        }

        // Load recent conversation history for continuity
        // Filter by taskId to ensure each task has isolated conversation context
        const conversationFilter = state.context?.taskId
          ? { taskId: state.context.taskId }
          : { taskId: null };

        console.log('Loading conversation history with filter:', conversationFilter);

        const recentMessages = await prisma.chatMessage.findMany({
          where: {
            userId: state.userId,
            ...conversationFilter
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Reduced from 10 to 5 for better performance
        });

        // Convert to LangChain messages for context
        const conversationHistory = recentMessages.reverse().map((msg) => {
          if (msg.role === 'user') {
            return new HumanMessage({ content: msg.content });
          } else {
            return new AIMessage({ content: msg.content });
          }
        });

        // Add conversation history to messages (prepend to existing messages)
        if (conversationHistory.length > 0) {
          updates.messages = [...conversationHistory, ...(state.messages || [])];
          console.log('Loaded conversation history:', conversationHistory.length, 'messages for', state.context?.taskId ? `task ${state.context.taskId}` : 'general chat');
        }
      }
      if (state.context?.taskId && state.userId) {
        const task = await TaskService.getTask(state.context.taskId, state.userId);
        updates.task = task;
        console.log('Loaded task:', task?.id, task?.title);
      }
      if (!state.context?.taskId && state.userId) {
        const tasks = await TaskService.getTasks(state.userId);
        updates.tasks = tasks;
        console.log('Loaded tasks count:', tasks?.length);
      }
      console.log('=== END LOAD CONTEXT ===');
      // updates.messages = [new HumanMessage({
      //   content: state.input
      // })];
    } catch (error) {
      console.error('Error loading context:', error);
      updates.error = `Failed to load context: ${error}`;
    }
    return updates;
  });

  graphBuilder.addNode('generateSummary', async (state: typeof StateAnnotation.State) => {
    const updates: Partial<typeof StateAnnotation.State> = {};
    const summary = state.summary;
    const conversationHistory = state.messages.map(msg => msg.content).join(' ');
    console.log('conversationHistory---', conversationHistory)
    try {
      let prompt = '';
      if (summary) {
        prompt = `This is summary of the conversation to date: \n${summary}\n\n Extend the summary by taking into account the new messages below: \n${conversationHistory}`;
      } else {
        prompt = `Create a summary of the conversation below: \n${conversationHistory}`;
      }
      const llm = createLLM('gpt-4o-mini', 0.2);
      const response = await llm.invoke(prompt);
      updates.summary = (response.content as string) || '';
      updates.messages = state.messages.slice(-2).map((msg) => (new RemoveMessage({ id: msg.id ?? '' })));
    } catch (error) {
      console.error('Error generating summary:', error);
      updates.error = `Failed to generate summary: ${error}`;
    }
    return updates;
  });

  graphBuilder.addNode('determineAgent', async (state: typeof StateAnnotation.State) => {
    let updates: Partial<typeof StateAnnotation.State> = {};
    try {
      updates = await determineAgent(state);
    } catch (error) {
      console.error('Error determining agent:', error);
      updates.error = `Failed to determine agent: ${error}`;
      updates.activeAgentType = AgentType.TaskCreation;
    }
    return updates;
  });

  graphBuilder.addNode('taskCreationAgent', async (state: typeof StateAnnotation.State) => {
    try {
      // Now processTaskCreation returns the updated state directly
      return await processTaskCreation(state, {
        prisma,
        TaskService,
      });
    } catch (error) {
      console.error('Error in task creation agent:', error);
      return { error: `Task creation agent error: ${error}` };
    }
  });

  graphBuilder.addNode('planningAgent', async (state: typeof StateAnnotation.State) => {
    try {
      // Now processPlanning returns the updated state directly
      return await processPlanning(state);
    } catch (error) {
      console.error('Error in planning agent:', error);
      return { error: `Planning agent error: ${error}` };
    }
  });

  graphBuilder.addNode('executionCoachAgent', async (state: typeof StateAnnotation.State) => {
    try {
      // Now processExecutionCoach returns the updated state directly
      return await processExecutionCoach(state);
    } catch (error) {
      console.error('Error in execution coach agent:', error);
      return { error: `Execution coach agent error: ${error}` };
    }
  });

  graphBuilder.addNode('adaptationAgent', async (state: typeof StateAnnotation.State) => {
    try {
      // Now processAdaptation returns the updated state directly
      return await processAdaptation(state);
    } catch (error) {
      console.error('Error in adaptation agent:', error);
      return { error: `Adaptation agent error: ${error}` };
    }
  });

  graphBuilder.addNode('analyticsAgent', async (state: typeof StateAnnotation.State) => {
    try {
      // Now processAnalytics returns the updated state directly
      return await processAnalytics(state);
    } catch (error) {
      console.error('Error in analytics agent:', error);
      return { error: `Analytics agent error: ${error}` };
    }
  });

  // Add executeActions node to process actions generated by agents
  graphBuilder.addNode('executeActions', async (state: typeof StateAnnotation.State) => {
    try {
      console.log('=== EXECUTE ACTIONS ===');
      console.log('Action items to execute:', state.actionItems?.length || 0);

      // If there are no actions to execute, skip gracefully
      if (!state.actionItems || state.actionItems.length === 0) {
        console.log('No actions to execute, skipping...');
        return {};
      }

      // Execute all actions and return updated state
      const updatedState = await executeActions(state, state.actionItems);
      console.log('Actions executed successfully');
      console.log('=== END EXECUTE ACTIONS ===');

      return updatedState;
    } catch (error) {
      console.error('Error executing actions:', error);
      // Don't fail the entire flow if action execution fails
      // Just log the error and continue
      return { error: `Action execution error: ${error}` };
    }
  });

  // Each specialized agent now executes its own actions and returns a response

  // generateResponse node removed as specialized agents now return responses directly

  // Define the workflow edges
  // @ts-ignore
  graphBuilder.addEdge(START, 'loadContext');
  // @ts-ignore
  graphBuilder.addEdge('loadContext', 'determineAgent');

  // Supervisor node routing logic is defined later
  // @ts-ignore
  // Specialized agents now route through executeActions before returning to supervisor
  graphBuilder.addEdge('taskCreationAgent', 'executeActions');
  // @ts-ignore
  graphBuilder.addEdge('planningAgent', 'executeActions');
  // @ts-ignore
  graphBuilder.addEdge('executionCoachAgent', 'executeActions');
  // @ts-ignore
  graphBuilder.addEdge('adaptationAgent', 'executeActions');
  // @ts-ignore
  graphBuilder.addEdge('analyticsAgent', 'executeActions');
  // @ts-ignore
  // executeActions routes to checkCompletion to prevent loops
  graphBuilder.addEdge('executeActions', 'checkCompletion');
  // @ts-ignore

  // Add checkCompletion node to prevent graph loops after action execution
  graphBuilder.addNode('checkCompletion', async (state: typeof StateAnnotation.State) => {
    // Always set activeAgentType to null after executeActions to force completion
    // This prevents the graph from looping back to loadContext
    console.log('=== CHECK COMPLETION ===');

    const updates: Partial<typeof StateAnnotation.State> = {
      activeAgentType: null
    };

    // Check if there were any errors during action execution
    if (state.error) {
      console.error('Error detected in state:', state.error);

      // Replace the agent's response with a user-friendly error message
      const errorResponse = `I apologize, but I wasn't able to complete that action due to a technical issue. Please try again, or let me know if you need help with something else.`;

      // Update the agent response to reflect the error
      updates.agentResponse = errorResponse;

      // Add an error message to the conversation
      const errorMessage = new AIMessage({
        content: errorResponse,
        name: 'system_error'
      });

      // Replace the last message (which was the agent's optimistic response) with the error
      updates.messages = [errorMessage];

      // Store error message in database with technical details in metadata
      try {
        const { ChatMessageService } = await import('./services/database.js');
        await ChatMessageService.createMessage({
          userId: state.userId,
          taskId: state.task?.id,
          content: errorResponse,
          role: 'assistant',
          metadata: { error: state.error, isError: true }
        });
        console.log('Error message stored in database');
      } catch (dbError) {
        console.error('Failed to store error message in database:', dbError);
      }

      // Clear the error from state after handling it
      updates.error = undefined;
    } else {
      console.log('No errors detected, setting activeAgentType to null to prevent loops');
    }

    console.log('=== END CHECK COMPLETION ===');
    return updates;
  });
  // @ts-ignore
  graphBuilder.addEdge('checkCompletion', 'determineAgent');
  // @ts-ignore
  // @ts-ignore
  // Add a conditional edge from determineAgent to handle completion
  graphBuilder.addConditionalEdges(
    // @ts-ignore
    'determineAgent',
    (state: typeof StateAnnotation.State) => {
      // If an agent has already produced a response, we're done
      if (state.activeAgentType === null) {
        // Generate a summary if conversation is getting long
        if (state.messages.length > 6) {
          return 'generateSummary';
        }
        return END;
      }

      // Otherwise route to the appropriate specialized agent
      switch(state.activeAgentType) {
        case AgentType.TaskCreation: return 'taskCreationAgent';
        case AgentType.Planning: return 'planningAgent';
        case AgentType.ExecutionCoach: return 'executionCoachAgent';
        case AgentType.Adaptation: return 'adaptationAgent';
        case AgentType.Analytics: return 'analyticsAgent';
        default: return 'taskCreationAgent';
      }
    }
  );
  // @ts-ignore
  graphBuilder.addEdge('generateSummary', END);

  // Compile and return the graph
  return graphBuilder.compile({ checkpointer: checkpointer, store: pg_store });
};
