/**
 * Single Task API Routes
 * GET /api/tasks/[id] - Get a task by ID
 * PUT /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Delete a task
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getTaskById, 
  getTaskSummaryById,
  updateTask, 
  deleteTask,
  getTaskLabels
} from "@/lib/db/repositories";
import { UpdateTaskInputSchema } from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]
 * Get a single task by ID with full details
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

    const task = getTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const taskSummary = getTaskSummaryById(taskId);
    const labels = getTaskLabels(taskId);

    return NextResponse.json({ 
      task,
      summary: taskSummary,
      labels
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]
 * Update a task
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    
    // Validate input
    const validatedInput = UpdateTaskInputSchema.parse(body);
    
    const task = updateTask(taskId, validatedInput);

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const taskSummary = getTaskSummaryById(taskId);
    const labels = getTaskLabels(taskId);

    return NextResponse.json({ 
      task,
      summary: taskSummary,
      labels
    });
  } catch (error) {
    console.error("Error updating task:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const success = deleteTask(taskId);

    if (!success) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
