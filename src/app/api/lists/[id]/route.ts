/**
 * Single List API Routes
 * GET /api/lists/[id] - Get a list by ID
 * PUT /api/lists/[id] - Update a list
 * DELETE /api/lists/[id] - Delete a list
 */

import { NextRequest, NextResponse } from "next/server";
import { getListById, updateList, deleteList } from "@/lib/db/repositories";
import { UpdateListInputSchema } from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/lists/[id]
 * Get a single list by ID
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

    const list = getListById(listId);

    if (!list) {
      return NextResponse.json(
        { error: "List not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ list });
  } catch (error) {
    console.error("Error fetching list:", error);
    return NextResponse.json(
      { error: "Failed to fetch list" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lists/[id]
 * Update a list
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    
    // Validate input
    const validatedInput = UpdateListInputSchema.parse(body);
    
    const list = updateList(listId, validatedInput);

    if (!list) {
      return NextResponse.json(
        { error: "List not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ list });
  } catch (error) {
    console.error("Error updating list:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === "Cannot delete the Inbox list") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lists/[id]
 * Delete a list
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if trying to delete Inbox (id = 1)
    if (listId === 1) {
      return NextResponse.json(
        { error: "Cannot delete the Inbox list" },
        { status: 403 }
      );
    }

    const success = deleteList(listId);

    if (!success) {
      return NextResponse.json(
        { error: "List not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "List deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting list:", error);
    
    if (error instanceof Error && error.message === "Cannot delete the Inbox list") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete list" },
      { status: 500 }
    );
  }
}
