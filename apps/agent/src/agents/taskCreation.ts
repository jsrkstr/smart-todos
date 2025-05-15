import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, AgentFinish, AgentStep, createToolCallingAgent } from 'langchain/agents';
import { AgentType, ActionItem } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { StateAnnotation } from '../types';
import { taskToolDefinitions } from '../utils/taskToolDefinitions';
import { RunnableConfig } from '@langchain/core/runnables';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';

// Main agent function with tool-calling using LangChain's native capabilities
export const processTaskCreation = async (
  state: typeof StateAnnotation.State,
  context: any
): Promise<typeof StateAnnotation.State> => {
  try {
    // Create LLM with tool-calling support
    const llm = createLLM('gpt-4o', 0.2);

    // Add context to tools before use
    // We need to enrich tools with the context they need to execute
    const toolsWithContext = taskToolDefinitions.map(tool => {
      // Clone the tool
      const clonedTool = Object.create(Object.getPrototypeOf(tool));
      Object.assign(clonedTool, tool);
      
      // Add the context to the tool directly
      // This is necessary because LangChain's tool executor doesn't pass context to tools
      (clonedTool as any)._context = {
        userId: state.userId,
        prisma: context?.prisma,
        TaskService: context?.TaskService,
      };

      return clonedTool;
    });

    // Prepare the conversation history for the agent
    const conversationHistory = state.messages.filter(
      (msg) =>
        msg.getType() === 'human' ||
        (msg.getType() === 'ai' && msg.additional_kwargs?.agentType === AgentType.TaskCreation)
    );
    
    // Create the prompt template for the agent
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        getSystemPrompt('taskCreation') +
          `

You have access to tools for reading and modifying tasks. Use these tools to help manage the user's tasks.

After executing any necessary tools, provide a helpful response summarizing what you've done.`
      ],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Create the tool-calling agent
    const agent = createToolCallingAgent({
      llm,
      tools: toolsWithContext,
      prompt,
    });

    // Create the agent executor to run the agent with tools
    const agentExecutor = new AgentExecutor({
      agent,
      tools: toolsWithContext,
      verbose: true, // Set to false in production
    });

    // Run the agent with the user's input and conversation history
    const result = await agentExecutor.invoke({
      input: state.input,
      chat_history: conversationHistory,
    }, {
      callbacks: [new ConsoleCallbackHandler()],
    } as RunnableConfig);

    console.log('result---', result)
    // Extract the agent's response
    const agentResponse = result.output;

    // Save the response to the state
    state.agentResponse = agentResponse;

    // Update message history with the agent's response
    state.messages.push(
      new AIMessage({
        content: agentResponse,
        additional_kwargs: {
          agentType: AgentType.TaskCreation,
        },
      })
    );

    return state;
  } catch (error) {
    console.error('Error in task creation agent:', error);
    
    // Handle error gracefully
    state.error = `Task creation error: ${error instanceof Error ? error.message : String(error)}`;
    state.agentResponse = 'I apologize, but I encountered an error processing your task request.';
    
    // Add error message to conversation
    state.messages.push(
      new AIMessage({
        content: state.agentResponse,
        additional_kwargs: {
          agentType: AgentType.TaskCreation,
          error: true,
        },
      })
    );
    
    return state;
  }
};
