import { StateGraph, END } from '@langchain/langgraph';
import { AgentType, GraphState, ActionItem } from './types';
import { determineAgent, generateResponse } from './agents/supervisor';
import { processTaskCreation } from './agents/taskCreation';
import { processPlanning } from './agents/planning';
import { processExecutionCoach } from './agents/executionCoach';
import { processAdaptation } from './agents/adaptation';
import { processAnalytics } from './agents/analytics';
import { executeActions } from './utils/actions';
import { UserService, TaskService } from './services/database';

// Create the main supervisor graph
export const createSupervisorGraph = () => {
  // Initialize the graph with our GraphState type
  const graph = new StateGraph<GraphState>({
    channels: {
      userId: {},
      input: {},
      context: {},
      user: {},
      task: {},
      tasks: {},
      activeAgentType: {},
      messages: {},
      agentResponse: {},
      actionItems: {},
      error: {}
    }
  });

  // Add nodes for each step in the workflow
  graph.addNode('loadContext', async (state) => {
    const newState = { ...state };
    
    try {
      // Load user information if userId is provided
      if (state.userId) {
        const user = await UserService.getUserWithProfile(state.userId);
        newState.user = user;
      }

      // Load task information if taskId is provided in context
      if (state.context?.taskId && state.userId) {
        const task = await TaskService.getTask(state.context.taskId, state.userId);
        newState.task = task;
      }

      // Initialize messages array if not already present
      if (!newState.messages) {
        newState.messages = [];
      }
      
      // Add user's current message to the messages array
      newState.messages.push({
        role: 'user',
        content: state.input
      });
    } catch (error) {
      console.error('Error loading context:', error);
      newState.error = `Failed to load context: ${error}`;
    }

    return newState;
  });

  graph.addNode('determineAgent', async (state) => {
    const newState = { ...state };
    
    try {
      // Determine which agent should handle this request
      const agentType = await determineAgent(state);
      newState.activeAgentType = agentType;
    } catch (error) {
      console.error('Error determining agent:', error);
      newState.error = `Failed to determine agent: ${error}`;
      newState.activeAgentType = AgentType.TaskCreation; // Default fallback
    }

    return newState;
  });

  // Add nodes for each agent type
  graph.addNode('taskCreationAgent', async (state) => {
    const newState = { ...state };
    
    try {
      const actions = await processTaskCreation(state);
      newState.actionItems = actions;
    } catch (error) {
      console.error('Error in task creation agent:', error);
      newState.error = `Task creation agent error: ${error}`;
    }

    return newState;
  });

  graph.addNode('planningAgent', async (state) => {
    const newState = { ...state };
    
    try {
      const actions = await processPlanning(state);
      newState.actionItems = actions;
    } catch (error) {
      console.error('Error in planning agent:', error);
      newState.error = `Planning agent error: ${error}`;
    }

    return newState;
  });

  graph.addNode('executionCoachAgent', async (state) => {
    const newState = { ...state };
    
    try {
      const actions = await processExecutionCoach(state);
      newState.actionItems = actions;
    } catch (error) {
      console.error('Error in execution coach agent:', error);
      newState.error = `Execution coach agent error: ${error}`;
    }

    return newState;
  });

  graph.addNode('adaptationAgent', async (state) => {
    const newState = { ...state };
    
    try {
      const actions = await processAdaptation(state);
      newState.actionItems = actions;
    } catch (error) {
      console.error('Error in adaptation agent:', error);
      newState.error = `Adaptation agent error: ${error}`;
    }

    return newState;
  });

  graph.addNode('analyticsAgent', async (state) => {
    const newState = { ...state };
    
    try {
      const actions = await processAnalytics(state);
      newState.actionItems = actions;
    } catch (error) {
      console.error('Error in analytics agent:', error);
      newState.error = `Analytics agent error: ${error}`;
    }

    return newState;
  });

  graph.addNode('executeActions', async (state) => {
    if (!state.actionItems || state.actionItems.length === 0) {
      return state; // No actions to execute
    }
    
    try {
      // Execute all actions and update state accordingly
      const newState = await executeActions(state, state.actionItems);
      return newState;
    } catch (error) {
      console.error('Error executing actions:', error);
      return {
        ...state,
        error: `Failed to execute actions: ${error}`
      };
    }
  });

  graph.addNode('generateResponse', async (state) => {
    const newState = { ...state };
    
    try {
      // Generate the final response using the supervisor agent
      const response = await generateResponse(state);
      newState.agentResponse = response;
      
      // Add the response to the messages array
      newState.messages.push({
        role: 'assistant',
        content: response
      });
    } catch (error) {
      console.error('Error generating response:', error);
      newState.error = `Failed to generate response: ${error}`;
      newState.agentResponse = 'I apologize, but I encountered an error processing your request.';
    }

    return newState;
  });

  // Define the workflow edges
  graph.addEdge('loadContext', 'determineAgent');
  
  // Route to the appropriate agent based on the determination
  graph.addConditionalEdges(
    'determineAgent',
    (state) => {
      switch(state.activeAgentType) {
        case AgentType.TaskCreation: return 'taskCreationAgent';
        case AgentType.Planning: return 'planningAgent';
        case AgentType.ExecutionCoach: return 'executionCoachAgent';
        case AgentType.Adaptation: return 'adaptationAgent';
        case AgentType.Analytics: return 'analyticsAgent';
        default: return 'taskCreationAgent'; // Default fallback
      }
    }
  );

  // After each agent processes, execute any generated actions
  graph.addEdge('taskCreationAgent', 'executeActions');
  graph.addEdge('planningAgent', 'executeActions');
  graph.addEdge('executionCoachAgent', 'executeActions');
  graph.addEdge('adaptationAgent', 'executeActions');
  graph.addEdge('analyticsAgent', 'executeActions');
  
  // After actions are executed, generate the final response
  graph.addEdge('executeActions', 'generateResponse');
  
  // End the workflow after generating the response
  graph.addEdge('generateResponse', END);

  // Compile the graph
  return graph.compile();
};
