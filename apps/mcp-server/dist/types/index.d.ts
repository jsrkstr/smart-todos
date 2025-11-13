import { z } from 'zod';
export declare const AuthTokenSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const GetTasksSchema: z.ZodObject<{
    token: z.ZodString;
    completed: z.ZodOptional<z.ZodBoolean>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    token: string;
    completed?: boolean | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    parentId?: string | null | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    token: string;
    completed?: boolean | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    parentId?: string | null | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const GetTaskSchema: z.ZodObject<{
    token: z.ZodString;
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
    token: string;
}, {
    taskId: string;
    token: string;
}>;
export declare const CreateTaskSchema: z.ZodObject<{
    token: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    dueDate: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    token: string;
    description?: string | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    parentId?: string | undefined;
    tags?: string[] | undefined;
    dueDate?: string | undefined;
}, {
    title: string;
    token: string;
    description?: string | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    parentId?: string | undefined;
    tags?: string[] | undefined;
    dueDate?: string | undefined;
}>;
export declare const UpdateTaskSchema: z.ZodObject<{
    token: z.ZodString;
    taskId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    completed: z.ZodOptional<z.ZodBoolean>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    taskId: string;
    token: string;
    title?: string | undefined;
    description?: string | undefined;
    completed?: boolean | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    tags?: string[] | undefined;
    dueDate?: string | null | undefined;
}, {
    taskId: string;
    token: string;
    title?: string | undefined;
    description?: string | undefined;
    completed?: boolean | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    tags?: string[] | undefined;
    dueDate?: string | null | undefined;
}>;
export declare const DeleteTaskSchema: z.ZodObject<{
    token: z.ZodString;
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
    token: string;
}, {
    taskId: string;
    token: string;
}>;
export declare const GetSubtasksSchema: z.ZodObject<{
    token: z.ZodString;
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
    token: string;
}, {
    taskId: string;
    token: string;
}>;
export declare const GetUserProfileSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const GetPsychProfileSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const GetUserSettingsSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const GetChatHistorySchema: z.ZodObject<{
    token: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    token: string;
    limit: number;
}, {
    token: string;
    limit?: number | undefined;
}>;
export declare const CreateChatMessageSchema: z.ZodObject<{
    token: z.ZodString;
    role: z.ZodEnum<["user", "assistant", "system"]>;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "user" | "assistant" | "system";
    token: string;
}, {
    content: string;
    role: "user" | "assistant" | "system";
    token: string;
}>;
export declare const GetPomodorosSchema: z.ZodObject<{
    token: z.ZodString;
    taskId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    token: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    taskId?: string | undefined;
}, {
    token: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    taskId?: string | undefined;
}>;
export declare const CreatePomodoroSchema: z.ZodObject<{
    token: z.ZodString;
    taskId: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    completed: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    completed: boolean;
    duration: number;
    token: string;
    taskId?: string | undefined;
}, {
    completed: boolean;
    duration: number;
    token: string;
    taskId?: string | undefined;
}>;
export type GetTasksInput = z.infer<typeof GetTasksSchema>;
export type GetTaskInput = z.infer<typeof GetTaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type DeleteTaskInput = z.infer<typeof DeleteTaskSchema>;
export type GetSubtasksInput = z.infer<typeof GetSubtasksSchema>;
export type GetUserProfileInput = z.infer<typeof GetUserProfileSchema>;
export type GetPsychProfileInput = z.infer<typeof GetPsychProfileSchema>;
export type GetUserSettingsInput = z.infer<typeof GetUserSettingsSchema>;
export type GetChatHistoryInput = z.infer<typeof GetChatHistorySchema>;
export type CreateChatMessageInput = z.infer<typeof CreateChatMessageSchema>;
export type GetPomodorosInput = z.infer<typeof GetPomodorosSchema>;
export type CreatePomodoroInput = z.infer<typeof CreatePomodoroSchema>;
//# sourceMappingURL=index.d.ts.map