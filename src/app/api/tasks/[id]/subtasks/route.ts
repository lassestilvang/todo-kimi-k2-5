/**
 * Task Subtasks API Route
 * GET /api/tasks/[id]/subtasks - Get all subtasks for a task
 * POST /api/tasks/[id]/subtasks - Create a new subtask
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getSubtasksByTaskId, 
  createSubtask,
  getTaskById
} from "@/lib/db/repositories";
import { CreateSubtaskInputSchema } from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]/subtasks
 * Get all subtasks for a task
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    // Check if task exists
    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const subtasks = getSubtasksByTaskId(taskId);

    return NextResponse.json({ subtasks, taskId });
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/subtasks
 * Create a new subtask
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    // Check if task exists
    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate input and inject taskId
    const inputWithTaskId = { ...body, taskId };
    const validatedInput = CreateSubtaskInputSchema.parse(inputWithTaskId);
    
    const subtask = createSubtask(validatedInput);
    
    return NextResponse.json({ subtask }, { status: 201 });
  } catch (error) {
    console.error("Error creating subtask:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}
