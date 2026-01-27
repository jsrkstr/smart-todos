"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupervisorGraph = void 0;
const langgraph_1 = require("@langchain/langgraph");
const index_1 = require("./types/index");
const supervisor_1 = require("./agents/supervisor");
const taskCreation_1 = require("./agents/taskCreation");
const planning_1 = require("./agents/planning");
const executionCoach_1 = require("./agents/executionCoach");
const adaptation_1 = require("./agents/adaptation");
const analytics_1 = require("./agents/analytics");
const actions_1 = require("./utils/actions");
const database_1 = require("./services/database");
const historicalContextService_1 = require("./services/historicalContextService");
const physicalContextService_1 = require("./services/physicalContextService");
const externalContextService_1 = require("./services/externalContextService");
const patternAnalysisService_1 = require("./services/patternAnalysisService");
const langgraph_checkpoint_postgres_1 = require("@langchain/langgraph-checkpoint-postgres");
const pg_store_1 = require("./utils/pg-store");
const messages_1 = require("@langchain/core/messages");
const llm_1 = require("./utils/llm");
const index_2 = require("./types/index");
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
const createSupervisorGraph = async (databaseUrl) => {
    // Use provided DATABASE_URL or fall back to environment variable
    const dbUrl = databaseUrl || process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL must be provided or set as environment variable');
    }
    // Initialize PostgreSQL store for long-term memory
    const pg_store = new pg_store_1.PostgresStore(dbUrl);
    await pg_store.initialize();
    // Initialize checkpointer for conversation state
    const checkpointer = langgraph_checkpoint_postgres_1.PostgresSaver.fromConnString(dbUrl, {
        schema: "langgraph", // defaults to "public"
    });
    // NOTE: you need to call .setup() the first time you're using your checkpointer
    await checkpointer.setup();
    // Initialize the graph with the state annotation
    const graphBuilder = new langgraph_1.StateGraph(index_2.StateAnnotation);
    // Add nodes for each step in the workflow
    graphBuilder.addNode('loadContext', async (state, ...args) => {
        var _a, _b, _c, _d, _e, _f;
        // const store = args[0].store;
        // await store.put(['1', 'memories'], '132', { 'food_preference': 'pizza' })
        console.log('=== LOAD CONTEXT ===');
        console.log('userId:', state.userId);
        console.log('taskId from context:', (_a = state.context) === null || _a === void 0 ? void 0 : _a.taskId);
        const updates = {};
        try {
            if (state.userId) {
                // Cache user profile - only load if not already in state
                if (!state.user) {
                    const user = await database_1.UserService.getUserWithProfile(state.userId);
                    // Fix type cast to match UserWithPsychProfile type
                    updates.user = user;
                    console.log('Loaded user:', user === null || user === void 0 ? void 0 : user.id);
                }
                else {
                    console.log('Using cached user from state');
                }
                // Load all contexts in parallel for better performance
                const historicalContextService = (0, historicalContextService_1.createHistoricalContextService)(database_1.prisma);
                const physicalContextService = (0, physicalContextService_1.createPhysicalContextService)(database_1.prisma);
                const externalContextService = (0, externalContextService_1.createExternalContextService)(database_1.prisma);
                const patternAnalysisService = (0, patternAnalysisService_1.createPatternAnalysisService)(database_1.prisma);
                // Parallel execution of all context services
                const [historicalContext, physicalContext, externalContext, behavioralPatterns] = await Promise.all([
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
                }
                else {
                    console.log('No recent physical context available');
                }
                updates.externalContext = externalContext;
                if (externalContext && externalContext.hasCalendarConnected) {
                    console.log('Loaded external context:', {
                        eventsToday: externalContext.eventsToday.length,
                        nextEvent: (_b = externalContext.nextEvent) === null || _b === void 0 ? void 0 : _b.title,
                        freeBlocks: externalContext.freeTimeBlocks.length,
                    });
                }
                else {
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
                const conversationFilter = ((_c = state.context) === null || _c === void 0 ? void 0 : _c.taskId)
                    ? { taskId: state.context.taskId }
                    : { taskId: null };
                console.log('Loading conversation history with filter:', conversationFilter);
                const recentMessages = await database_1.prisma.chatMessage.findMany({
                    where: Object.assign({ userId: state.userId }, conversationFilter),
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 5, // Reduced from 10 to 5 for better performance
                });
                // Convert to LangChain messages for context
                const conversationHistory = recentMessages.reverse().map((msg) => {
                    if (msg.role === 'user') {
                        return new messages_1.HumanMessage({ content: msg.content });
                    }
                    else {
                        return new messages_1.AIMessage({ content: msg.content });
                    }
                });
                // Add conversation history to messages (prepend to existing messages)
                if (conversationHistory.length > 0) {
                    updates.messages = [...conversationHistory, ...(state.messages || [])];
                    console.log('Loaded conversation history:', conversationHistory.length, 'messages for', ((_d = state.context) === null || _d === void 0 ? void 0 : _d.taskId) ? `task ${state.context.taskId}` : 'general chat');
                }
            }
            if (((_e = state.context) === null || _e === void 0 ? void 0 : _e.taskId) && state.userId) {
                const task = await database_1.TaskService.getTask(state.context.taskId, state.userId);
                updates.task = task;
                console.log('Loaded task:', task === null || task === void 0 ? void 0 : task.id, task === null || task === void 0 ? void 0 : task.title);
            }
            if (!((_f = state.context) === null || _f === void 0 ? void 0 : _f.taskId) && state.userId) {
                const tasks = await database_1.TaskService.getTasks(state.userId);
                updates.tasks = tasks;
                console.log('Loaded tasks count:', tasks === null || tasks === void 0 ? void 0 : tasks.length);
            }
            console.log('=== END LOAD CONTEXT ===');
            // updates.messages = [new HumanMessage({
            //   content: state.input
            // })];
        }
        catch (error) {
            console.error('Error loading context:', error);
            updates.error = `Failed to load context: ${error}`;
        }
        return updates;
    });
    graphBuilder.addNode('generateSummary', async (state) => {
        const updates = {};
        const summary = state.summary;
        const conversationHistory = state.messages.map(msg => msg.content).join(' ');
        console.log('conversationHistory---', conversationHistory);
        try {
            let prompt = '';
            if (summary) {
                prompt = `This is summary of the conversation to date: \n${summary}\n\n Extend the summary by taking into account the new messages below: \n${conversationHistory}`;
            }
            else {
                prompt = `Create a summary of the conversation below: \n${conversationHistory}`;
            }
            const llm = (0, llm_1.createLLM)('gpt-4o-mini', 0.2);
            const response = await llm.invoke(prompt);
            updates.summary = response.content || '';
            updates.messages = state.messages.slice(-2).map((msg) => { var _a; return (new messages_1.RemoveMessage({ id: (_a = msg.id) !== null && _a !== void 0 ? _a : '' })); });
        }
        catch (error) {
            console.error('Error generating summary:', error);
            updates.error = `Failed to generate summary: ${error}`;
        }
        return updates;
    });
    graphBuilder.addNode('determineAgent', async (state) => {
        let updates = {};
        try {
            updates = await (0, supervisor_1.determineAgent)(state);
        }
        catch (error) {
            console.error('Error determining agent:', error);
            updates.error = `Failed to determine agent: ${error}`;
            updates.activeAgentType = index_1.AgentType.TaskCreation;
        }
        return updates;
    });
    graphBuilder.addNode('taskCreationAgent', async (state) => {
        try {
            // Now processTaskCreation returns the updated state directly
            return await (0, taskCreation_1.processTaskCreation)(state, {
                prisma: database_1.prisma,
                TaskService: database_1.TaskService,
            });
        }
        catch (error) {
            console.error('Error in task creation agent:', error);
            return { error: `Task creation agent error: ${error}` };
        }
    });
    graphBuilder.addNode('planningAgent', async (state) => {
        try {
            // Now processPlanning returns the updated state directly
            return await (0, planning_1.processPlanning)(state);
        }
        catch (error) {
            console.error('Error in planning agent:', error);
            return { error: `Planning agent error: ${error}` };
        }
    });
    graphBuilder.addNode('executionCoachAgent', async (state) => {
        try {
            // Now processExecutionCoach returns the updated state directly
            return await (0, executionCoach_1.processExecutionCoach)(state);
        }
        catch (error) {
            console.error('Error in execution coach agent:', error);
            return { error: `Execution coach agent error: ${error}` };
        }
    });
    graphBuilder.addNode('adaptationAgent', async (state) => {
        try {
            // Now processAdaptation returns the updated state directly
            return await (0, adaptation_1.processAdaptation)(state);
        }
        catch (error) {
            console.error('Error in adaptation agent:', error);
            return { error: `Adaptation agent error: ${error}` };
        }
    });
    graphBuilder.addNode('analyticsAgent', async (state) => {
        try {
            // Now processAnalytics returns the updated state directly
            return await (0, analytics_1.processAnalytics)(state);
        }
        catch (error) {
            console.error('Error in analytics agent:', error);
            return { error: `Analytics agent error: ${error}` };
        }
    });
    // Add executeActions node to process actions generated by agents
    graphBuilder.addNode('executeActions', async (state) => {
        var _a;
        try {
            console.log('=== EXECUTE ACTIONS ===');
            console.log('Action items to execute:', ((_a = state.actionItems) === null || _a === void 0 ? void 0 : _a.length) || 0);
            // If there are no actions to execute, skip gracefully
            if (!state.actionItems || state.actionItems.length === 0) {
                console.log('No actions to execute, skipping...');
                return {};
            }
            // Execute all actions and return updated state
            const updatedState = await (0, actions_1.executeActions)(state, state.actionItems);
            console.log('Actions executed successfully');
            console.log('=== END EXECUTE ACTIONS ===');
            return updatedState;
        }
        catch (error) {
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
    graphBuilder.addEdge(langgraph_1.START, 'loadContext');
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
    graphBuilder.addNode('checkCompletion', async (state) => {
        var _a;
        // Always set activeAgentType to null after executeActions to force completion
        // This prevents the graph from looping back to loadContext
        console.log('=== CHECK COMPLETION ===');
        const updates = {
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
            const errorMessage = new messages_1.AIMessage({
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
                    taskId: (_a = state.task) === null || _a === void 0 ? void 0 : _a.id,
                    content: errorResponse,
                    role: 'assistant',
                    metadata: { error: state.error, isError: true }
                });
                console.log('Error message stored in database');
            }
            catch (dbError) {
                console.error('Failed to store error message in database:', dbError);
            }
            // Clear the error from state after handling it
            updates.error = undefined;
        }
        else {
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
    'determineAgent', (state) => {
        // If an agent has already produced a response, we're done
        if (state.activeAgentType === null) {
            // Generate a summary if conversation is getting long
            if (state.messages.length > 6) {
                return 'generateSummary';
            }
            return langgraph_1.END;
        }
        // Otherwise route to the appropriate specialized agent
        switch (state.activeAgentType) {
            case index_1.AgentType.TaskCreation: return 'taskCreationAgent';
            case index_1.AgentType.Planning: return 'planningAgent';
            case index_1.AgentType.ExecutionCoach: return 'executionCoachAgent';
            case index_1.AgentType.Adaptation: return 'adaptationAgent';
            case index_1.AgentType.Analytics: return 'analyticsAgent';
            default: return 'taskCreationAgent';
        }
    });
    // @ts-ignore
    graphBuilder.addEdge('generateSummary', langgraph_1.END);
    // Compile and return the graph
    return graphBuilder.compile({ checkpointer: checkpointer, store: pg_store });
};
exports.createSupervisorGraph = createSupervisorGraph;
