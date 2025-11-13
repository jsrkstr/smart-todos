"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.TaskType = exports.AgentType = exports.StateAnnotation = void 0;
const langgraph_1 = require("@langchain/langgraph");
// Define the state annotation for the graph, including reducers where appropriate
exports.StateAnnotation = langgraph_1.Annotation.Root({
    userId: (0, langgraph_1.Annotation)(),
    jwtToken: (0, langgraph_1.Annotation)(), // JWT token for MCP authentication
    input: (0, langgraph_1.Annotation)(),
    context: (0, langgraph_1.Annotation)(), // You can further annotate structure if needed
    user: (0, langgraph_1.Annotation)(),
    task: (0, langgraph_1.Annotation)(),
    tasks: (0, langgraph_1.Annotation)(),
    activeAgentType: (0, langgraph_1.Annotation)(),
    // https://langchain-ai.github.io/langgraphjs/reference/variables/langgraph.MessagesAnnotation.html
    messages: (0, langgraph_1.Annotation)({
        reducer: langgraph_1.messagesStateReducer,
        default: () => [],
    }),
    summary: (0, langgraph_1.Annotation)(),
    agentResponse: (0, langgraph_1.Annotation)(),
    actionItems: (0, langgraph_1.Annotation)(),
    error: (0, langgraph_1.Annotation)(),
});
// Types of agents in the system
var AgentType;
(function (AgentType) {
    AgentType["Supervisor"] = "supervisor";
    AgentType["TaskCreation"] = "taskCreation";
    AgentType["Planning"] = "planning";
    AgentType["ExecutionCoach"] = "executionCoach";
    AgentType["Adaptation"] = "adaptation";
    AgentType["Analytics"] = "analytics";
})(AgentType || (exports.AgentType = AgentType = {}));
// Types of tasks the agents can perform
var TaskType;
(function (TaskType) {
    TaskType["Create"] = "create";
    TaskType["Refine"] = "refine";
    TaskType["Breakdown"] = "breakdown";
    TaskType["Prioritize"] = "prioritize";
    TaskType["Execute"] = "execute";
    TaskType["Analyze"] = "analyze";
    TaskType["Adapt"] = "adapt";
})(TaskType || (exports.TaskType = TaskType = {}));
// Types of actions that agents can generate
var ActionType;
(function (ActionType) {
    ActionType["CreateTask"] = "createTask";
    ActionType["UpdateTask"] = "updateTask";
    ActionType["CreateSubtasks"] = "createSubtasks";
    ActionType["SearchTasks"] = "searchTasks";
    ActionType["UpdateManyTasks"] = "updateManyTasks";
    ActionType["LogActivity"] = "logActivity";
    ActionType["ScheduleReminder"] = "scheduleReminder";
    ActionType["ProvideMotivation"] = "provideMotivation";
    ActionType["GiveAdvice"] = "giveAdvice";
    ActionType["AskQuestion"] = "askQuestion";
})(ActionType || (exports.ActionType = ActionType = {}));
