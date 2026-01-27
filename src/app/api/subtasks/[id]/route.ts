/**
 * Single Subtask API Routes
 * PUT /api/subtasks/[id] - Update a subtask
 * DELETE /api/subtasks/[id] - Delete a subtask
 * POST /api/subtasks/[id]/toggle - Toggle subtask completion
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getSubtaskById, 
  updateSubtask, 
  deleteSubtask,
  toggleSubtaskCompletion
} from "@/lib/db/repositories";
import { UpdateSubtaskInputSchema } from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/subtasks/[id]
 * Update a subtask
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const subtaskId = parseInt(id, 10);

    if (isNaN(subtaskId)) {
      return NextResponse.json(
        { error: "Invalid subtask ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedInput = UpdateSubtaskInputSchema.parse(body);
    
    const subtask = updateSubtask(subtaskId, validatedInput);

    if (!subtask) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subtask });
  } catch (error) {
    console.error("Error updating subtask:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subtasks/[id]
 * Delete a subtask
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const subtaskId = parseInt(id, 10);

    if (isNaN(subtaskId)) {
      return NextResponse.json(
        { error: "Invalid subtask ID" },
        { status: 400 }
      );
    }

    const success = deleteSubtask(subtaskId);

    if (!success) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Subtask deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting subtask:", error);
    return NextResponse.json(
      { error: "Failed to delete subtask" },
      { status: 500 }
    );
  }
}
