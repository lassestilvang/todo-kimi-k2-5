/**
 * Lists API Routes
 * GET /api/lists - Get all lists
 * POST /api/lists - Create a new list
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllListsWithTaskCounts, createList } from "@/lib/db/repositories";
import { CreateListInputSchema } from "@/lib/validation/schemas";
import { runMigrations } from "@/lib/db/migrations";
import { ZodError } from "zod";

/**
 * GET /api/lists
 * Get all lists with task counts
 */
export async function GET() {
  try {
    // Ensure database is initialized
    runMigrations();

    const lists = getAllListsWithTaskCounts();
    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Error fetching lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch lists" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lists
 * Create a new list
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    runMigrations();

    const body = await request.json();
    
    // Validate input
    const validatedInput = CreateListInputSchema.parse(body);
    
    const list = createList(validatedInput);
    
    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Error creating list:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create list" },
      { status: 500 }
    );
  }
}
