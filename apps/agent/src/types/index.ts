import { BaseMessage } from '@langchain/core/messages';
import { Task, User, PsychProfile, Coach } from '@prisma/client';
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

export interface UserWithPsychProfile extends User {
  psychProfile?: PsychProfile & {
    coach?: Coach;
  };
}

// Define the state annotation for the graph, including reducers where appropriate
export const StateAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  input: Annotation<string>(),
  context: Annotation<any>(), // You can further annotate structure if needed
  user: Annotation<UserWithPsychProfile | null>(),
  task: Annotation<Task & {
      children?: Task[];
    } | null>(),
  tasks: Annotation<Task[] | null>(),
  activeAgentType: Annotation<AgentType | null>(),
  // https://langchain-ai.github.io/langgraphjs/reference/variables/langgraph.MessagesAnnotation.html
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  summary: Annotation<string   | null>(),
  agentResponse: Annotation<string | null>(),
  actionItems: Annotation<ActionItem[]>(),
  error: Annotation<string | null>(),
});


// Types of messages in the agent conversation
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  agentType?: AgentType;
  name?: string;
}

// Types of agents in the system
export enum AgentType {
  Supervisor = 'supervisor',
  TaskCreation = 'taskCreation',
  Planning = 'planning',
  ExecutionCoach = 'executionCoach',
  Adaptation = 'adaptation',
  Analytics = 'analytics'
}

// Types of tasks the agents can perform
export enum TaskType {
  Create = 'create',
  Refine = 'refine',
  Breakdown = 'breakdown',
  Prioritize = 'prioritize',
  Execute = 'execute',
  Analyze = 'analyze',
  Adapt = 'adapt'
}

// Action items that can be returned from agent processing
export interface ActionItem {
  type: ActionType;
  payload: any;
}

// Types of actions that agents can generate
export enum ActionType {
  CreateTask = 'createTask',
  UpdateTask = 'updateTask',
  CreateSubtasks = 'createSubtasks',
  SearchTasks = 'searchTasks',
  UpdateManyTasks = 'updateManyTasks',
  LogActivity = 'logActivity',
  ScheduleReminder = 'scheduleReminder',
  ProvideMotivation = 'provideMotivation',
  GiveAdvice = 'giveAdvice',
  AskQuestion = 'askQuestion'
}
