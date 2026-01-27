/**
 * List Tasks API Route
 * GET /api/lists/[id]/tasks - Get all tasks in a list
 */

import { NextRequest, NextResponse } from "next/server";
import { getTasksByListId, getListById } from "@/lib/db/repositories";
import { runMigrations } from "@/lib/db/migrations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/lists/[id]/tasks
 * Get all tasks in a list
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const listId = parseInt(id, 10);

    if (isNaN(listId)) {
      return NextResponse.json(
        { error: "Invalid list ID" },
        { status: 400 }
      );
    }

    // Check if list exists
    const list = getListById(listId);
    if (!list) {
      return NextResponse.json(
        { error: "List not found" },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    const tasks = getTasksByListId(listId, includeCompleted);

    return NextResponse.json({ tasks, list });
  } catch (error) {
    console.error("Error fetching list tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
