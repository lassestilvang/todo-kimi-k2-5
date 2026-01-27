/**
 * Task Attachments API Route
 * GET /api/tasks/[id]/attachments - Get all attachments for a task
 * POST /api/tasks/[id]/attachments - Create a new attachment
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getAttachmentsByTaskId, 
  createAttachment,
  getTaskById
} from "@/lib/db/repositories";
import { CreateAttachmentInputSchema } from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]/attachments
 * Get all attachments for a task
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

    const attachments = getAttachmentsByTaskId(taskId);

    return NextResponse.json({ attachments, taskId });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/attachments
 * Create a new attachment
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
    const validatedInput = CreateAttachmentInputSchema.parse(inputWithTaskId);
    
    const attachment = createAttachment(validatedInput);
    
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error("Error creating attachment:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create attachment" },
      { status: 500 }
    );
  }
}
