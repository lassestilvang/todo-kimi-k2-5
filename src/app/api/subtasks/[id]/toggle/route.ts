/**
 * Subtask Toggle API Route
 * POST /api/subtasks/[id]/toggle - Toggle subtask completion status
 */

import { NextRequest, NextResponse } from "next/server";
import { toggleSubtaskCompletion, getSubtaskById } from "@/lib/db/repositories";
import { runMigrations } from "@/lib/db/migrations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/subtasks/[id]/toggle
 * Toggle subtask completion status
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Check if subtask exists
    const existingSubtask = getSubtaskById(subtaskId);
    if (!existingSubtask) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }

    const subtask = toggleSubtaskCompletion(subtaskId);

    if (!subtask) {
      return NextResponse.json(
        { error: "Failed to toggle subtask completion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      subtask,
      message: subtask.isCompleted 
        ? "Subtask marked as completed" 
        : "Subtask marked as incomplete"
    });
  } catch (error) {
    console.error("Error toggling subtask completion:", error);
    return NextResponse.json(
      { error: "Failed to toggle subtask completion" },
      { status: 500 }
    );
  }
}
