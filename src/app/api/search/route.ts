/**
 * Search API Route
 * GET /api/search?q=query&limit=20 - Fuzzy search tasks and labels
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  searchTasks, 
  searchLabels, 
  globalSearch,
  quickSearchTasks,
  getSearchSuggestions,
  advancedSearch
} from "@/lib/db/repositories";
import { runMigrations } from "@/lib/db/migrations";

/**
 * GET /api/search
 * Fuzzy search across tasks and labels
 */
export async function GET(request: NextRequest) {
  try {
    runMigrations();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    if (!query || query.trim() === "") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const type = searchParams.get("type");

    // Parse filter options for advanced search
    const listId = searchParams.get("listId");
    const priority = searchParams.get("priority");
    const isCompleted = searchParams.get("isCompleted");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const labelIds = searchParams.getAll("labelId");

    // If any filters are provided, use advanced search
    if (listId || priority || isCompleted !== null || dateFrom || dateTo || labelIds.length > 0) {
      const tasks = advancedSearch({
        query,
        listId: listId ? parseInt(listId, 10) : undefined,
        priority: priority || undefined,
        isCompleted: isCompleted !== null ? isCompleted === "true" : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        labelIds: labelIds.length > 0 ? labelIds.map((id) => parseInt(id, 10)) : undefined,
        limit,
      });

      return NextResponse.json({ 
        tasks,
        query,
        type: "advanced"
      });
    }

    // Simple search by type
    if (type === "tasks") {
      const results = searchTasks(query, { limit });
      return NextResponse.json({ 
        tasks: results.map(r => r.item),
        scores: results.map(r => r.score),
        query,
        type: "tasks"
      });
    }

    if (type === "labels") {
      const results = searchLabels(query, limit);
      return NextResponse.json({ 
        labels: results.map(r => r.item),
        scores: results.map(r => r.score),
        query,
        type: "labels"
      });
    }

    if (type === "quick") {
      const tasks = quickSearchTasks(query, limit);
      return NextResponse.json({ 
        tasks,
        query,
        type: "quick"
      });
    }

    if (type === "suggestions") {
      const suggestions = getSearchSuggestions(query, limit);
      return NextResponse.json({ 
        suggestions,
        query,
        type: "suggestions"
      });
    }

    // Default: global search
    const results = globalSearch(query, limit);
    
    return NextResponse.json({
      tasks: results.tasks.map(r => ({ ...r.item, score: r.score })),
      labels: results.labels.map(r => ({ ...r.item, score: r.score })),
      query,
      type: "global",
      totalResults: results.tasks.length + results.labels.length
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
