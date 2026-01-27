/**
 * API Route for Database Status
 * Runs database migrations and returns status
 */

import { NextResponse } from "next/server";
import { runMigrations, getMigrationStatus, verifyTables } from "@/lib/db/migrations";
import { getDatabaseStats } from "@/lib/db";

export async function GET() {
  try {
    // Run migrations
    runMigrations();

    // Get stats
    const stats = getDatabaseStats();
    const status = getMigrationStatus();
    const tables = verifyTables();

    return NextResponse.json({
      status: {
        tables: stats.tables,
        indexes: stats.indexes,
        isMigrated: status.isMigrated,
        hasDefaultData: status.hasDefaultData,
      },
      tables,
    });
  } catch (error) {
    console.error("Error getting status:", error);
    return NextResponse.json(
      { error: "Failed to get database status" },
      { status: 500 }
    );
  }
}
