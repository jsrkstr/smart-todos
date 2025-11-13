import { StateGraph, Annotation, BaseStore, InMemoryStore, START, END, MessagesAnnotation, messagesStateReducer } from '@langchain/langgraph';
import { AgentType, ActionItem } from './types/index';
import { determineAgent } from './agents/supervisor';
import { processTaskCreation } from './agents/taskCreation';
import { processPlanning } from './agents/planning';
import { processExecutionCoach } from './agents/executionCoach';
import { processAdaptation } from './agents/adaptation';
import { processAnalytics } from './agents/analytics';
// executeActions is now handled by specialized agents directly
import { UserService, TaskService } from './services/database';
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
        const user = await UserService.getUserWithProfile(state.userId);
        // Fix type cast to match UserWithPsychProfile type
        updates.user = user as unknown as typeof StateAnnotation.State['user'];
        console.log('Loaded user:', user?.id);
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
      return await processTaskCreation(state, {});
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

  // Each specialized agent now executes its own actions and returns a response

  // generateResponse node removed as specialized agents now return responses directly

  // Define the workflow edges
  // @ts-ignore
  graphBuilder.addEdge(START, 'loadContext');
  // @ts-ignore
  graphBuilder.addEdge('loadContext', 'determineAgent');

  // Supervisor node routing logic is defined later
  // @ts-ignore
  // Specialized agents now return to the supervisor for potential further routing
  graphBuilder.addEdge('taskCreationAgent', 'determineAgent');
  // @ts-ignore
  graphBuilder.addEdge('planningAgent', 'determineAgent');
  // @ts-ignore
  graphBuilder.addEdge('executionCoachAgent', 'determineAgent');
  // @ts-ignore
  graphBuilder.addEdge('adaptationAgent', 'determineAgent');
  // @ts-ignore
  graphBuilder.addEdge('analyticsAgent', 'determineAgent');
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
