/**
 * Activity API Routes
 * GET /api/activity - Get recent activity across all tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getRecentActivity,
  getActivityStats,
  getActivityByDateRange
} from "@/lib/db/repositories";
import { runMigrations } from "@/lib/db/migrations";

/**
 * GET /api/activity
 * Get recent activity across all tasks
 */
export async function GET(request: NextRequest) {
  try {
    runMigrations();

    const { searchParams } = new URL(request.url);
    
    // Check if stats are requested
    if (searchParams.get("stats") === "true") {
      const stats = getActivityStats();
      return NextResponse.json({ stats });
    }

    // Parse date range
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    
    if (dateFrom && dateTo) {
      const activity = getActivityByDateRange(dateFrom, dateTo);
      return NextResponse.json({ 
        activity,
        dateRange: { from: dateFrom, to: dateTo }
      });
    }

    // Default: get recent activity
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const activity = getRecentActivity(limit);

    return NextResponse.json({ activity, limit });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
