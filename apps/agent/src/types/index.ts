import { BaseMessage } from '@langchain/core/messages';
import { Task, User, PsychProfile, Coach } from '@prisma/client';

// Main state type for the supervisor graph
export interface GraphState {
  userId: string;
  input: string;
  context?: {
    taskId?: string;
    modelName?: string;
  };
  user?: User & {
    psychProfile?: PsychProfile & {
      coach?: Coach;
    };
  };
  task?: Task & {
    children?: Task[];
  };
  tasks?: Task[];
  activeAgentType?: AgentType;
  messages: BaseMessage[];
  agentResponse?: string;
  actionItems?: ActionItem[];
  error?: string;
}

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
