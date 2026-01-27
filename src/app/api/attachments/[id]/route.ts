/**
 * Single Attachment API Route
 * GET /api/attachments/[id] - Get an attachment by ID
 * DELETE /api/attachments/[id] - Delete an attachment
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getAttachmentById, 
  deleteAttachment 
} from "@/lib/db/repositories";
import { runMigrations } from "@/lib/db/migrations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/attachments/[id]
 * Get a single attachment by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const attachmentId = parseInt(id, 10);

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: "Invalid attachment ID" },
        { status: 400 }
      );
    }

    const attachment = getAttachmentById(attachmentId);

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error("Error fetching attachment:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attachments/[id]
 * Delete an attachment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const attachmentId = parseInt(id, 10);

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: "Invalid attachment ID" },
        { status: 400 }
      );
    }

    const success = deleteAttachment(attachmentId);

    if (!success) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Attachment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
