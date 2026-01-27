/**
 * Single Label API Routes
 * GET /api/labels/[id] - Get a label by ID
 * PUT /api/labels/[id] - Update a label
 * DELETE /api/labels/[id] - Delete a label
 */

import { NextRequest, NextResponse } from "next/server";
import { getLabelById, updateLabel, deleteLabel } from "@/lib/db/repositories";
import { UpdateLabelInputSchema } from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/labels/[id]
 * Get a single label by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const labelId = parseInt(id, 10);

    if (isNaN(labelId)) {
      return NextResponse.json(
        { error: "Invalid label ID" },
        { status: 400 }
      );
    }

    const label = getLabelById(labelId);

    if (!label) {
      return NextResponse.json(
        { error: "Label not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ label });
  } catch (error) {
    console.error("Error fetching label:", error);
    return NextResponse.json(
      { error: "Failed to fetch label" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/labels/[id]
 * Update a label
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const labelId = parseInt(id, 10);

    if (isNaN(labelId)) {
      return NextResponse.json(
        { error: "Invalid label ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedInput = UpdateLabelInputSchema.parse(body);
    
    const label = updateLabel(labelId, validatedInput);

    if (!label) {
      return NextResponse.json(
        { error: "Label not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ label });
  } catch (error) {
    console.error("Error updating label:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update label" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/labels/[id]
 * Delete a label
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    runMigrations();

    const { id } = await params;
    const labelId = parseInt(id, 10);

    if (isNaN(labelId)) {
      return NextResponse.json(
        { error: "Invalid label ID" },
        { status: 400 }
      );
    }

    const success = deleteLabel(labelId);

    if (!success) {
      return NextResponse.json(
        { error: "Label not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Label deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting label:", error);
    return NextResponse.json(
      { error: "Failed to delete label" },
      { status: 500 }
    );
  }
}
