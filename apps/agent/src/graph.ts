import { StateGraph, Annotation, BaseStore, InMemoryStore, START, END, MessagesAnnotation, messagesStateReducer } from '@langchain/langgraph';
import { AgentType, ActionItem } from './types/index';
import { determineAgent, generateResponse } from './agents/supervisor';
import { processTaskCreation } from './agents/taskCreation';
import { processPlanning } from './agents/planning';
import { processExecutionCoach } from './agents/executionCoach';
import { processAdaptation } from './agents/adaptation';
import { processAnalytics } from './agents/analytics';
import { executeActions } from './utils/actions';
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
export const createSupervisorGraph = async () => {

  // Example usage:
  const pg_store = new PostgresStore(
    `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}?sslmode=require`
  );
  await pg_store.initialize();
  
  const checkpointer = PostgresSaver.fromConnString(
    `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}?sslmode=require`,
    // optional configuration object
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
    console.log('state---', state)

    const updates: Partial<typeof StateAnnotation.State> = {};
    try {
      if (state.userId) {
        const user = await UserService.getUserWithProfile(state.userId);
        updates.user = user;
      }
      if (state.context?.taskId && state.userId) {
        const task = await TaskService.getTask(state.context.taskId, state.userId);
        updates.task = task;
      }
      if (!state.context?.taskId && state.userId) {
        const tasks = await TaskService.getTasks(state.userId);
        updates.tasks = tasks;
      }
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
    const updates: Partial<GraphState> = {};
    try {
      const agentType = await determineAgent(state);
      updates.activeAgentType = agentType;
    } catch (error) {
      console.error('Error determining agent:', error);
      updates.error = `Failed to determine agent: ${error}`;
      updates.activeAgentType = AgentType.TaskCreation;
    }
    return updates;
  });

  graphBuilder.addNode('taskCreationAgent', async (state: typeof StateAnnotation.State) => {
    const updates: Partial<GraphState> = {};
    try {
      const actions = await processTaskCreation(state);
      updates.actionItems = actions;
    } catch (error) {
      console.error('Error in task creation agent:', error);
      updates.error = `Task creation agent error: ${error}`;
    }
    return updates;
  });

  graphBuilder.addNode('planningAgent', async (state: typeof StateAnnotation.State) => {
    const updates: Partial<GraphState> = {};
    try {
      const actions = await processPlanning(state);
      updates.actionItems = actions;
    } catch (error) {
      console.error('Error in planning agent:', error);
      updates.error = `Planning agent error: ${error}`;
    }
    return updates;
  });

  graphBuilder.addNode('executionCoachAgent', async (state: typeof StateAnnotation.State) => {
    const updates: Partial<GraphState> = {};
    try {
      const actions = await processExecutionCoach(state);
      updates.actionItems = actions;
    } catch (error) {
      console.error('Error in execution coach agent:', error);
      updates.error = `Execution coach agent error: ${error}`;
    }
    return updates;
  });

  graphBuilder.addNode('adaptationAgent', async (state: typeof StateAnnotation.State) => {
    const updates: Partial<GraphState> = {};
    try {
      const actions = await processAdaptation(state);
      updates.actionItems = actions;
    } catch (error) {
      console.error('Error in adaptation agent:', error);
      updates.error = `Adaptation agent error: ${error}`;
    }
    return updates;
  });

  graphBuilder.addNode('analyticsAgent', async (state: typeof StateAnnotation.State) => {
    const updates: Partial<GraphState> = {};
    try {
      const actions = await processAnalytics(state);
      updates.actionItems = actions;
    } catch (error) {
      console.error('Error in analytics agent:', error);
      updates.error = `Analytics agent error: ${error}`;
    }
    return updates;
  });

  graphBuilder.addNode('executeActions', async (state: typeof StateAnnotation.State) => {
    if (!state.actionItems || state.actionItems.length === 0) {
      return {};
    }
    try {
      const newState = await executeActions(state, state.actionItems);
      return newState;
    } catch (error) {
      console.error('Error executing actions:', error);
      return { error: `Failed to execute actions: ${error}` };
    }
  });

  graphBuilder.addNode('generateResponse', async (state: typeof StateAnnotation.State, ...args: any[]) => {
    // const store = args[0].store;
    // console.log('food pref---', await store.get(['1', 'memories'], '132'))

    const updates: Partial<GraphState> = {};
    try {
      const response = await generateResponse(state);
      updates.agentResponse = response;
      updates.messages = [new AIMessage({
        content: response
      })];
    } catch (error) {
      console.error('Error generating response:', error);
      updates.error = `Failed to generate response: ${error}`;
      updates.agentResponse = 'I apologize, but I encountered an error processing your request.';
    }
    return updates;
  });

  // Define the workflow edges
  // @ts-ignore
  graphBuilder.addEdge(START, 'loadContext');
  // @ts-ignore
  graphBuilder.addEdge('loadContext', 'determineAgent');

  graphBuilder.addConditionalEdges(
    // @ts-ignore
    'determineAgent',
    (state: typeof StateAnnotation.State) => {
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
  graphBuilder.addEdge('executeActions', 'generateResponse');
  // @ts-ignore
  graphBuilder.addConditionalEdges(
    // @ts-ignore
    'generateResponse',
    (state: typeof StateAnnotation.State) => {
      if (state.messages.length > 6) {
        return 'generateSummary';
      }
      return END;
    }
  );
  // @ts-ignore
  graphBuilder.addEdge('generateSummary', END);

  // Compile and return the graph
  return graphBuilder.compile({ checkpointer: checkpointer, store: pg_store });
};
