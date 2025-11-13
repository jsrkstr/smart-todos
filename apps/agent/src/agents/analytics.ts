import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentType, ActionItem } from '../types';
import { createLLM, getSystemPrompt } from '../utils/llm';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { StateAnnotation } from '../types';
import { getMCPClient } from '../services/mcp-client';
import { generateAnalyticsCode, generateTaskPatternsAnalysisCode, generateSmartTaskRecommendationsCode } from '../utils/code-generator';

// Process the user input with Analytics agent
export const processAnalytics = async (state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State> => {
  // Try to use MCP code execution for analytics (high efficiency)
  // If it fails, fall back to traditional analysis
  let analyticsData: any = null;
  let usingMCP = false;

  // Check if we have JWT token for MCP
  if (state.jwtToken) {
    try {
      const mcpClient = await getMCPClient();

      console.log('[Analytics Agent] Using MCP code execution for analytics');

      // Execute analytics code in sandbox
      const analyticsCode = generateAnalyticsCode();
      const analyticsResult = await mcpClient.executeCode(
        analyticsCode,
        state.jwtToken
      );

      // Execute pattern analysis code in sandbox
      const patternsCode = generateTaskPatternsAnalysisCode();
      const patternsResult = await mcpClient.executeCode(
        patternsCode,
        state.jwtToken
      );

      // Execute smart recommendations code
      const recommendationsCode = generateSmartTaskRecommendationsCode();
      const recommendationsResult = await mcpClient.executeCode(
        recommendationsCode,
        state.jwtToken
      );

      analyticsData = {
        summary: analyticsResult.content?.[0]?.text ? JSON.parse(analyticsResult.content[0].text) : null,
        patterns: patternsResult.content?.[0]?.text ? JSON.parse(patternsResult.content[0].text) : null,
        recommendations: recommendationsResult.content?.[0]?.text ? JSON.parse(recommendationsResult.content[0].text) : null,
      };

      usingMCP = true;
      console.log('[Analytics Agent] MCP code execution successful');
    } catch (error) {
      console.warn('[Analytics Agent] MCP code execution failed, falling back to traditional analysis:', error);
      usingMCP = false;
    }
  }

  // Create LLM
  const llm = createLLM('gpt-4o', 0.2);

  // Create parser for structured output
  const outputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      actions: z.array(
        z.object({
          type: z.enum([
            'logActivity',
            'none'
          ]),
          payload: z.any()
        })
      ),
      insights: z.array(z.string()).describe('Key insights derived from analyzing task patterns and performance'),
      recommendations: z.array(z.string()).describe('Specific recommendations for improving productivity or task management'),
      reasoning: z.string().describe('Your analytical process and methodology'),
      response: z.string().describe('A concise, helpful response to the user summarizing the key insights and recommendations')
    })
  );

  // Prepare the conversation history
  const conversationHistory = state.messages.filter(msg =>
    msg.getType() === 'human' ||
    (msg.getType() === 'ai' && msg.additional_kwargs.agentType === AgentType.Analytics)
  );

  // Build context based on whether we used MCP or not
  let tasksContext = '';

  if (usingMCP && analyticsData) {
    // Use the comprehensive analytics data from MCP
    tasksContext = `Analytics Summary (from MCP code execution - 98% more efficient):\n\n`;
    tasksContext += `Overall Statistics:\n`;
    tasksContext += `- Total tasks: ${analyticsData.summary?.total || 0}\n`;
    tasksContext += `- Completed: ${analyticsData.summary?.completed || 0}\n`;
    tasksContext += `- Pending: ${analyticsData.summary?.pending || 0}\n`;
    tasksContext += `- Overdue: ${analyticsData.summary?.overdue || 0}\n`;
    tasksContext += `- Completion rate: ${analyticsData.summary?.completionRate || 0}%\n`;
    tasksContext += `- Average completion time: ${analyticsData.summary?.avgCompletionDays || 0} days\n\n`;

    if (analyticsData.summary?.priorityCounts) {
      tasksContext += `Priority Distribution:\n`;
      tasksContext += `- High: ${analyticsData.summary.priorityCounts.high || 0}\n`;
      tasksContext += `- Medium: ${analyticsData.summary.priorityCounts.medium || 0}\n`;
      tasksContext += `- Low: ${analyticsData.summary.priorityCounts.low || 0}\n\n`;
    }

    tasksContext += `Upcoming Tasks:\n`;
    tasksContext += `- Due today: ${analyticsData.summary?.dueToday || 0}\n`;
    tasksContext += `- Due tomorrow: ${analyticsData.summary?.dueTomorrow || 0}\n`;
    tasksContext += `- Due this week: ${analyticsData.summary?.dueThisWeek || 0}\n\n`;

    if (analyticsData.patterns?.topTags && analyticsData.patterns.topTags.length > 0) {
      tasksContext += `Top Tags:\n`;
      analyticsData.patterns.topTags.forEach((tag: any) => {
        tasksContext += `- ${tag.tag}: ${tag.count} tasks\n`;
      });
      tasksContext += '\n';
    }

    if (analyticsData.patterns?.longRunningTasks && analyticsData.patterns.longRunningTasks.length > 0) {
      tasksContext += `Longest Running Open Tasks:\n`;
      analyticsData.patterns.longRunningTasks.forEach((task: any, idx: number) => {
        tasksContext += `${idx + 1}. ${task.title} (${task.daysOpen} days open, priority: ${task.priority})\n`;
      });
      tasksContext += '\n';
    }

    if (analyticsData.recommendations?.recommendations && analyticsData.recommendations.recommendations.length > 0) {
      tasksContext += `Smart Recommendations (based on user profile):\n`;
      analyticsData.recommendations.recommendations.forEach((rec: any, idx: number) => {
        tasksContext += `${idx + 1}. ${rec.title} (priority: ${rec.priority}, score: ${rec.score})\n`;
      });
    }
  } else {
    // Fallback to traditional task listing
    // Check if we have a specific task or multiple tasks
    const allTasks = state.task ? [state.task] : (state.tasks || []);

    console.log('[Analytics Agent] Tasks available:', allTasks.length);
    console.log('[Analytics Agent] state.task:', state.task?.id, state.task?.title);
    console.log('[Analytics Agent] state.tasks count:', state.tasks?.length);

    tasksContext = allTasks.length > 0 ?
      `User has ${allTasks.length} task(s).\n` +
      allTasks.map((task, index) =>
        `Task ${index+1}: ${task.title}\nStatus: ${task.completed ? 'Completed' : 'Not Completed'}\nPriority: ${task.priority}\nStage: ${task.stage}\nDescription: ${task.description || 'None'}`
      ).join('\n\n') :
      'No tasks available';
  }

  // Determine the context type for better prompting
  const isTaskSpecific = state.task !== null;
  const contextInstructions = isTaskSpecific
    ? `IMPORTANT: The user is currently viewing a SPECIFIC TASK. Answer their question about THIS TASK ONLY. Do not suggest adding more tasks or talk about their overall task list.`
    : `The user is asking about their overall task management and productivity. Provide insights across all their tasks.`;

  // Create a prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', getSystemPrompt('analytics') + `\n\n${contextInstructions}\n\nRespond with a structured output containing actions, insights, recommendations, reasoning, and a concise user-friendly response.`],
    new MessagesPlaceholder('conversation_history'),
    ['human', `User request: {input}\n\nTasks Context:\n${tasksContext}\n\nAnalyze the user's request and provide relevant information. ${isTaskSpecific ? 'Focus on answering their specific question about this task.' : 'Look for trends in completion rates, task types, and productivity patterns.'} Provide a structured response with insights, recommendations, and any actions to take in JSON format. Include a concise user-friendly response. {format_instructions}`],
  ]);

  // Create the chain
  const chain = RunnableSequence.from([
    {
      input: (state: typeof StateAnnotation.State) => state.input,
      conversation_history: (state: typeof StateAnnotation.State) => conversationHistory,
      format_instructions: async () => outputParser.getFormatInstructions()
    },
    prompt,
    llm,
    outputParser
  ]);

  // Execute the chain
  const result = await chain.invoke(state);

  // Record the agent's insights as a message
  if (result.insights && result.insights.length > 0) {
    state.messages.push(new AIMessage({
      content: `Key Insights:\n${result.insights.map(insight => `- ${insight}`).join('\n')}`,
      additional_kwargs: {
        agentType: AgentType.Analytics,
        name: 'insights'
      }
    }));
  }

  // Record the agent's recommendations as a message
  if (result.recommendations && result.recommendations.length > 0) {
    state.messages.push(new AIMessage({
      content: `Recommendations:\n${result.recommendations.map(rec => `- ${rec}`).join('\n')}`,
      additional_kwargs: {
        agentType: AgentType.Analytics,
        name: 'recommendations'
      }
    }));
  }

  // Record the agent's thought process as a message
  if (result.reasoning) {
    state.messages.push(new AIMessage({
      content: result.reasoning,
      additional_kwargs: {
        agentType: AgentType.Analytics,
        name: 'reasoning'
      }
    }));
  }

  // Store the actions for execution
  state.actionItems = result.actions.filter((action) => action.type !== 'none') as ActionItem[];
  
  // Create response for the user
  if (result.response) {
    state.agentResponse = result.response;
    
    // Push the agent's response to the message history
    state.messages.push(
      new AIMessage({
        content: state.agentResponse,
        additional_kwargs: {
          agentType: AgentType.Analytics,
        },
      })
    );
  }
  
  return state;
};
