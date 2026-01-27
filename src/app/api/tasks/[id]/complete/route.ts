/**
 * Task Completion API Route
 * POST /api/tasks/[id]/complete - Toggle task completion status
 */

import { NextRequest, NextResponse } from "next/server";
import { toggleTaskCompletion, getTaskById } from "@/lib/db/repositories";
import { runMigrations } from "@/lib/db/migrations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tasks/[id]/complete
 * Toggle task completion status
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
    const existingTask = getTaskById(taskId);
    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const task = toggleTaskCompletion(taskId);

    if (!task) {
      return NextResponse.json(
        { error: "Failed to toggle task completion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      task,
      message: task.isCompleted 
        ? "Task marked as completed" 
        : "Task marked as incomplete"
    });
  } catch (error) {
    console.error("Error toggling task completion:", error);
    return NextResponse.json(
      { error: "Failed to toggle task completion" },
      { status: 500 }
    );
  }
}
