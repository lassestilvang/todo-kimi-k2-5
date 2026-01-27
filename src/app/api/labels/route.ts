/**
 * Labels API Routes
 * GET /api/labels - Get all labels
 * POST /api/labels - Create a new label
 */

import { NextRequest, NextResponse } from "next/server";
import { getLabelsWithTaskCount, createLabel } from "@/lib/db/repositories";
import { CreateLabelInputSchema } from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";

/**
 * GET /api/labels
 * Get all labels with task counts
 */
export async function GET() {
  try {
    runMigrations();

    const labels = getLabelsWithTaskCount();
    return NextResponse.json({ labels });
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/labels
 * Create a new label
 */
export async function POST(request: NextRequest) {
  try {
    runMigrations();

    const body = await request.json();
    
    // Validate input
    const validatedInput = CreateLabelInputSchema.parse(body);
    
    const label = createLabel(validatedInput);
    
    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    console.error("Error creating label:", error);
    
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
      { error: "Failed to create label" },
      { status: 500 }
    );
  }
}
