/**
 * Task Activity API Route
 * GET /api/tasks/[id]/activity - Get activity log for a task
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getActivityByTaskId, 
  getTaskById,
  getActivityDescription
} from "@/lib/db/repositories";
import { runMigrations } from "@/lib/db/migrations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]/activity
 * Get activity log for a task
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const activity = getActivityByTaskId(taskId, limit);

    // Add human-readable descriptions
    const activityWithDescriptions = activity.map((log) => ({
      ...log,
      description: getActivityDescription(log),
    }));

    return NextResponse.json({ 
      activity: activityWithDescriptions,
      taskId,
      taskName: task.name
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
