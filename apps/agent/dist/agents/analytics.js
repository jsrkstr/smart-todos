"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAnalytics = void 0;
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const types_1 = require("../types");
const llm_1 = require("../utils/llm");
const output_parsers_1 = require("langchain/output_parsers");
const zod_1 = require("zod");
const messages_1 = require("@langchain/core/messages");
const mcp_client_1 = require("../services/mcp-client");
const code_generator_1 = require("../utils/code-generator");
// Process the user input with Analytics agent
const processAnalytics = async (state) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    // Try to use MCP code execution for analytics (high efficiency)
    // If it fails, fall back to traditional analysis
    let analyticsData = null;
    let usingMCP = false;
    // Check if we have JWT token for MCP
    if (state.jwtToken) {
        try {
            const mcpClient = await (0, mcp_client_1.getMCPClient)();
            console.log('[Analytics Agent] Using MCP code execution for analytics');
            // Execute analytics code in sandbox
            const analyticsCode = (0, code_generator_1.generateAnalyticsCode)();
            const analyticsResult = await mcpClient.executeCode(analyticsCode, state.jwtToken);
            // Execute pattern analysis code in sandbox
            const patternsCode = (0, code_generator_1.generateTaskPatternsAnalysisCode)();
            const patternsResult = await mcpClient.executeCode(patternsCode, state.jwtToken);
            // Execute smart recommendations code
            const recommendationsCode = (0, code_generator_1.generateSmartTaskRecommendationsCode)();
            const recommendationsResult = await mcpClient.executeCode(recommendationsCode, state.jwtToken);
            analyticsData = {
                summary: ((_b = (_a = analyticsResult.content) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.text) ? JSON.parse(analyticsResult.content[0].text) : null,
                patterns: ((_d = (_c = patternsResult.content) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.text) ? JSON.parse(patternsResult.content[0].text) : null,
                recommendations: ((_f = (_e = recommendationsResult.content) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text) ? JSON.parse(recommendationsResult.content[0].text) : null,
            };
            usingMCP = true;
            console.log('[Analytics Agent] MCP code execution successful');
        }
        catch (error) {
            console.warn('[Analytics Agent] MCP code execution failed, falling back to traditional analysis:', error);
            usingMCP = false;
        }
    }
    // Create LLM
    const llm = (0, llm_1.createLLM)('gpt-4o', 0.2);
    // Create parser for structured output
    const outputParser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.object({
        actions: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.enum([
                'logActivity',
                'none'
            ]),
            payload: zod_1.z.any()
        })),
        insights: zod_1.z.array(zod_1.z.string()).describe('Key insights derived from analyzing task patterns and performance'),
        recommendations: zod_1.z.array(zod_1.z.string()).describe('Specific recommendations for improving productivity or task management'),
        reasoning: zod_1.z.string().describe('Your analytical process and methodology'),
        response: zod_1.z.string().describe('A concise, helpful response to the user summarizing the key insights and recommendations')
    }));
    // Prepare the conversation history
    const conversationHistory = state.messages.filter(msg => msg.getType() === 'human' ||
        (msg.getType() === 'ai' && msg.additional_kwargs.agentType === types_1.AgentType.Analytics));
    // Build context based on whether we used MCP or not
    let tasksContext = '';
    if (usingMCP && analyticsData) {
        // Use the comprehensive analytics data from MCP
        tasksContext = `Analytics Summary (from MCP code execution - 98% more efficient):\n\n`;
        tasksContext += `Overall Statistics:\n`;
        tasksContext += `- Total tasks: ${((_g = analyticsData.summary) === null || _g === void 0 ? void 0 : _g.total) || 0}\n`;
        tasksContext += `- Completed: ${((_h = analyticsData.summary) === null || _h === void 0 ? void 0 : _h.completed) || 0}\n`;
        tasksContext += `- Pending: ${((_j = analyticsData.summary) === null || _j === void 0 ? void 0 : _j.pending) || 0}\n`;
        tasksContext += `- Overdue: ${((_k = analyticsData.summary) === null || _k === void 0 ? void 0 : _k.overdue) || 0}\n`;
        tasksContext += `- Completion rate: ${((_l = analyticsData.summary) === null || _l === void 0 ? void 0 : _l.completionRate) || 0}%\n`;
        tasksContext += `- Average completion time: ${((_m = analyticsData.summary) === null || _m === void 0 ? void 0 : _m.avgCompletionDays) || 0} days\n\n`;
        if ((_o = analyticsData.summary) === null || _o === void 0 ? void 0 : _o.priorityCounts) {
            tasksContext += `Priority Distribution:\n`;
            tasksContext += `- High: ${analyticsData.summary.priorityCounts.high || 0}\n`;
            tasksContext += `- Medium: ${analyticsData.summary.priorityCounts.medium || 0}\n`;
            tasksContext += `- Low: ${analyticsData.summary.priorityCounts.low || 0}\n\n`;
        }
        tasksContext += `Upcoming Tasks:\n`;
        tasksContext += `- Due today: ${((_p = analyticsData.summary) === null || _p === void 0 ? void 0 : _p.dueToday) || 0}\n`;
        tasksContext += `- Due tomorrow: ${((_q = analyticsData.summary) === null || _q === void 0 ? void 0 : _q.dueTomorrow) || 0}\n`;
        tasksContext += `- Due this week: ${((_r = analyticsData.summary) === null || _r === void 0 ? void 0 : _r.dueThisWeek) || 0}\n\n`;
        if (((_s = analyticsData.patterns) === null || _s === void 0 ? void 0 : _s.topTags) && analyticsData.patterns.topTags.length > 0) {
            tasksContext += `Top Tags:\n`;
            analyticsData.patterns.topTags.forEach((tag) => {
                tasksContext += `- ${tag.tag}: ${tag.count} tasks\n`;
            });
            tasksContext += '\n';
        }
        if (((_t = analyticsData.patterns) === null || _t === void 0 ? void 0 : _t.longRunningTasks) && analyticsData.patterns.longRunningTasks.length > 0) {
            tasksContext += `Longest Running Open Tasks:\n`;
            analyticsData.patterns.longRunningTasks.forEach((task, idx) => {
                tasksContext += `${idx + 1}. ${task.title} (${task.daysOpen} days open, priority: ${task.priority})\n`;
            });
            tasksContext += '\n';
        }
        if (((_u = analyticsData.recommendations) === null || _u === void 0 ? void 0 : _u.recommendations) && analyticsData.recommendations.recommendations.length > 0) {
            tasksContext += `Smart Recommendations (based on user profile):\n`;
            analyticsData.recommendations.recommendations.forEach((rec, idx) => {
                tasksContext += `${idx + 1}. ${rec.title} (priority: ${rec.priority}, score: ${rec.score})\n`;
            });
        }
    }
    else {
        // Fallback to traditional task listing
        // Check if we have a specific task or multiple tasks
        const allTasks = state.task ? [state.task] : (state.tasks || []);
        console.log('[Analytics Agent] Tasks available:', allTasks.length);
        console.log('[Analytics Agent] state.task:', (_v = state.task) === null || _v === void 0 ? void 0 : _v.id, (_w = state.task) === null || _w === void 0 ? void 0 : _w.title);
        console.log('[Analytics Agent] state.tasks count:', (_x = state.tasks) === null || _x === void 0 ? void 0 : _x.length);
        tasksContext = allTasks.length > 0 ?
            `User has ${allTasks.length} task(s).\n` +
                allTasks.map((task, index) => `Task ${index + 1}: ${task.title}\nStatus: ${task.completed ? 'Completed' : 'Not Completed'}\nPriority: ${task.priority}\nStage: ${task.stage}\nDescription: ${task.description || 'None'}`).join('\n\n') :
            'No tasks available';
    }
    // Determine the context type for better prompting
    const isTaskSpecific = state.task !== null;
    const contextInstructions = isTaskSpecific
        ? `IMPORTANT: The user is currently viewing a SPECIFIC TASK. Answer their question about THIS TASK ONLY. Do not suggest adding more tasks or talk about their overall task list.`
        : `The user is asking about their overall task management and productivity. Provide insights across all their tasks.`;
    // Create a prompt template
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', (0, llm_1.getSystemPrompt)('analytics') + `\n\n${contextInstructions}\n\nRespond with a structured output containing actions, insights, recommendations, reasoning, and a concise user-friendly response.`],
        new prompts_1.MessagesPlaceholder('conversation_history'),
        ['human', `User request: {input}\n\nTasks Context:\n${tasksContext}\n\nAnalyze the user's request and provide relevant information. ${isTaskSpecific ? 'Focus on answering their specific question about this task.' : 'Look for trends in completion rates, task types, and productivity patterns.'} Provide a structured response with insights, recommendations, and any actions to take in JSON format. Include a concise user-friendly response. {format_instructions}`],
    ]);
    // Create the chain
    const chain = runnables_1.RunnableSequence.from([
        {
            input: (state) => state.input,
            conversation_history: (state) => conversationHistory,
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
        state.messages.push(new messages_1.AIMessage({
            content: `Key Insights:\n${result.insights.map(insight => `- ${insight}`).join('\n')}`,
            additional_kwargs: {
                agentType: types_1.AgentType.Analytics,
                name: 'insights'
            }
        }));
    }
    // Record the agent's recommendations as a message
    if (result.recommendations && result.recommendations.length > 0) {
        state.messages.push(new messages_1.AIMessage({
            content: `Recommendations:\n${result.recommendations.map(rec => `- ${rec}`).join('\n')}`,
            additional_kwargs: {
                agentType: types_1.AgentType.Analytics,
                name: 'recommendations'
            }
        }));
    }
    // Record the agent's thought process as a message
    if (result.reasoning) {
        state.messages.push(new messages_1.AIMessage({
            content: result.reasoning,
            additional_kwargs: {
                agentType: types_1.AgentType.Analytics,
                name: 'reasoning'
            }
        }));
    }
    // Store the actions for execution
    state.actionItems = result.actions.filter((action) => action.type !== 'none');
    // Create response for the user
    if (result.response) {
        state.agentResponse = result.response;
        // Push the agent's response to the message history
        state.messages.push(new messages_1.AIMessage({
            content: state.agentResponse,
            additional_kwargs: {
                agentType: types_1.AgentType.Analytics,
            },
        }));
    }
    return state;
};
exports.processAnalytics = processAnalytics;
