/**
 * Tasks API Routes
 * GET /api/tasks - Get tasks (filtered)
 * POST /api/tasks - Create a new task
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getTaskSummaries, 
  getTasksByView, 
  createTask 
} from "@/lib/db/repositories";
import { 
  CreateTaskInputSchema, 
  TaskFilterSchema,
  TaskViewSchema,
  PrioritySchema
} from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";
import type { TaskFilter } from "@/lib/types";

/**
 * GET /api/tasks
 * Get tasks with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    runMigrations();

    const { searchParams } = new URL(request.url);

    // Check for view parameter (today, upcoming, next7, all, completed)
    const viewParam = searchParams.get("view");
    if (viewParam) {
      const viewResult = TaskViewSchema.safeParse(viewParam);
      if (viewResult.success) {
        const tasks = getTasksByView(viewResult.data);
        return NextResponse.json({ tasks, view: viewResult.data });
      }
    }

    // Build filter from query params
    const filter: TaskFilter = {};

    const listId = searchParams.get("listId");
    if (listId) {
      filter.listId = parseInt(listId, 10);
    }

    const priority = searchParams.get("priority");
    if (priority) {
      const priorityResult = PrioritySchema.safeParse(priority);
      if (priorityResult.success) {
        filter.priority = priorityResult.data;
      }
    }

    const isCompleted = searchParams.get("isCompleted");
    if (isCompleted !== null) {
      filter.isCompleted = isCompleted === "true";
    }

    const taskDate = searchParams.get("taskDate");
    if (taskDate) {
      filter.taskDate = taskDate;
    }

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (dateFrom && dateTo) {
      filter.dateRange = { start: dateFrom, end: dateTo };
    }

    const labelIds = searchParams.getAll("labelId");
    if (labelIds.length > 0) {
      filter.labelIds = labelIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    }

    // Validate filter
    const validatedFilter = TaskFilterSchema.parse(filter);
    const tasks = getTaskSummaries(validatedFilter);

    return NextResponse.json({ tasks, filter: validatedFilter });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    runMigrations();

    const body = await request.json();
    
    // Validate input
    const validatedInput = CreateTaskInputSchema.parse(body);
    
    const task = createTask(validatedInput);
    
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
