import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TaskStatus, ReminderTimeOption } from '@prisma/client'
import { AuthenticatedApiRequest, withAuth } from '@/lib/api-middleware'

interface TaskPayload {
  id: string;
  title: string;
  date: string;
  time?: string;
  deadline?: string | null;
  dateAdded: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  position?: number;
  location?: string;
  why?: string;
  estimatedTimeMinutes?: number;
  repeats?: string;
  subTasks?: { 
    title: string; 
    status: TaskStatus;
    position?: number;
    estimatedTimeMinutes?: number;
    date?: string;
    rank?: number;
  }[];
  reminderTime?: ReminderTimeOption;
}

interface TaskUpdatePayload {
  id: string;
  [key: string]: any;
}

interface DeleteTaskPayload {
  id: string;
}

// GET /api/tasks
export const GET = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      include: { subTasks: true },
      orderBy: { dateAdded: 'desc' }
    })

    return NextResponse.json(tasks.map(task => ({
      ...task,
      date: task.date.toISOString(),
      deadline: task.deadline?.toISOString() || null,
      dateAdded: task.dateAdded.toISOString(),
    })))
  } catch (error) {
    // Safe error handling
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to get tasks:', errorMessage);
    return NextResponse.json({ error: 'Failed to get tasks' }, { status: 500 })
  }
})

// POST /api/tasks
export const POST = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    // Wrap in a try/catch to handle potential JSON parsing errors
    let taskData: TaskPayload;
    try {
      taskData = await req.json();
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error';
      console.error('Invalid JSON in request body:', errorMessage);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Check if taskData is valid
    if (!taskData || !taskData.title) {
      console.error('Invalid task data received:', taskData);
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 });
    }

    console.log("Received task data:", JSON.stringify(taskData, null, 2));

    // Make sure reminderTime is a valid enum value
    if (taskData.reminderTime && typeof taskData.reminderTime === 'string') {
      // Verify it's a valid enum value
      const validReminderTimes: string[] = [
        "at_time", "five_min_before", "fifteen_min_before", 
        "thirty_min_before", "one_hour_before", "one_day_before"
      ];
      
      if (!validReminderTimes.includes(taskData.reminderTime)) {
        taskData.reminderTime = "at_time";
      }
    }

    // Ensure priority is a valid value
    if (!taskData.priority || !["low", "medium", "high"].includes(taskData.priority)) {
      taskData.priority = "medium";
    }

    const { subTasks, ...taskWithoutSubTasks } = taskData;
    const newTask = await prisma.task.create({
      data: {
        ...taskWithoutSubTasks,
        date: new Date(taskData.date),
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
        dateAdded: new Date(taskData.dateAdded),
        userId: req.user.id,
        subTasks: {
          create: subTasks?.map(st => ({
            ...st,
            status: st.status || "new"
          })) || []
        }
      },
      include: { subTasks: true }
    });

    return NextResponse.json({
      ...newTask,
      date: newTask.date.toISOString(),
      deadline: newTask.deadline?.toISOString() || null,
      dateAdded: newTask.dateAdded.toISOString(),
    });
  } catch (error) {
    // Safe error handling
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create task:', errorMessage);
    
    return NextResponse.json({ 
      error: 'Failed to create task', 
      details: errorMessage
    }, { status: 500 });
  }
})

// PUT /api/tasks
export const PUT = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let payload: TaskUpdatePayload;
    try {
      payload = await req.json();
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error';
      console.error('Invalid JSON in request body:', errorMessage);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Missing task ID' }, { status: 400 });
    }

    // Make sure reminderTime is a valid enum value
    if (payload.reminderTime && typeof payload.reminderTime === 'string') {
      // Verify it's a valid enum value
      const validReminderTimes: string[] = [
        "at_time", "five_min_before", "fifteen_min_before", 
        "thirty_min_before", "one_hour_before", "one_day_before"
      ];
      
      if (!validReminderTimes.includes(payload.reminderTime)) {
        payload.reminderTime = "at_time";
      }
    }
    
    const { id, ...updates } = payload;
    const task = await prisma.task.update({
      where: { 
        id,
        userId: req.user.id // Ensure user can only update their own tasks
      },
      data: {
        ...updates,
        date: updates.date ? new Date(updates.date) : undefined,
        deadline: updates.deadline ? new Date(updates.deadline) : undefined,
        subTasks: updates.subTasks ? {
          deleteMany: {},
          create: updates.subTasks
        } : undefined
      },
      include: { subTasks: true }
    });

    return NextResponse.json({
      ...task,
      date: task.date.toISOString(),
      deadline: task.deadline?.toISOString() || null,
      dateAdded: task.dateAdded.toISOString(),
    });
  } catch (error) {
    // Safe error handling
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update task:', errorMessage);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
})

// DELETE /api/tasks
export const DELETE = withAuth(async (req: AuthenticatedApiRequest): Promise<NextResponse> => {
  try {
    let payload: DeleteTaskPayload;
    try {
      payload = await req.json();
    } catch (jsonError) {
      const errorMessage: string = jsonError instanceof Error ? jsonError.message : 'Unknown error';
      console.error('Invalid JSON in request body:', errorMessage);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Missing task ID' }, { status: 400 });
    }

    await prisma.task.delete({
      where: { 
        id: payload.id,
        userId: req.user.id // Ensure user can only delete their own tasks
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Safe error handling
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete task:', errorMessage);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}) 