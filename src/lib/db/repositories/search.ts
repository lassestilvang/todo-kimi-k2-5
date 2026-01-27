/**
 * Search Repository
 * Fuzzy search implementation using Fuse.js
 */

import Fuse from "fuse.js";
import { query as dbQuery } from "@/lib/db";
import type { TaskSummary, TaskSummaryRow, Label, LabelRow } from "@/lib/types";

// ============================================================================
// FUSE CONFIGURATION
// ============================================================================

const taskFuseOptions = {
  keys: [
    { name: "name", weight: 0.5 },
    { name: "listName", weight: 0.2 },
    { name: "labelCount", weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
};

const labelFuseOptions = {
  keys: [
    { name: "name", weight: 0.8 },
    { name: "icon", weight: 0.2 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
};

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search tasks using Fuse.js fuzzy matching
 * Searches task names, list names, and includes label information
 */
export function searchTasks(
  queryStr: string,
  options: {
    listId?: number;
    isCompleted?: boolean;
    limit?: number;
  } = {}
): Array<{ item: TaskSummary; score: number }> {
  const { listId, isCompleted, limit = 20 } = options;

  // Build base query
  let sql = `
    SELECT 
      ts.*,
      t.description,
      GROUP_CONCAT(l.name) as label_names
    FROM task_summary ts
    JOIN tasks t ON ts.id = t.id
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
  `;
  
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (listId !== undefined) {
    conditions.push("ts.list_id = ?");
    params.push(listId);
  }

  if (isCompleted !== undefined) {
    conditions.push("ts.is_completed = ?");
    params.push(isCompleted ? 1 : 0);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " GROUP BY ts.id";

  interface SearchRow extends TaskSummaryRow {
    description: string | null;
    label_names: string | null;
  }

  const rows = dbQuery<SearchRow>(sql, params);

  // Prepare tasks for Fuse search - using snake_case since it comes from DB
  const tasksForSearch = rows.map((row) => ({
    id: row.id,
    name: row.name,
    isCompleted: Boolean(row.is_completed),
    priority: row.priority,
    taskDate: row.task_date,
    deadline: row.deadline,
    listId: row.list_id,
    listName: row.list_name,
    listColor: row.list_color,
    labelCount: row.label_count,
    totalSubtasks: row.total_subtasks,
    completedSubtasks: row.completed_subtasks,
    attachmentCount: row.attachment_count,
    // Additional searchable fields
    description: row.description,
    labelText: row.label_names ?? "",
  }));

  // Create Fuse instance and search
  const fuse = new Fuse(tasksForSearch, {
    ...taskFuseOptions,
    keys: [
      { name: "name", weight: 0.5 },
      { name: "description", weight: 0.3 },
      { name: "labelText", weight: 0.15 },
      { name: "listName", weight: 0.05 },
    ],
  });

  const results = fuse.search(queryStr);
  
  return results.slice(0, limit).map((result) => ({
    item: result.item,
    score: result.score ?? 1,
  }));
}

/**
 * Quick search for tasks (basic SQL LIKE fallback)
 * Use this for simpler, faster searches
 */
export function quickSearchTasks(
  queryStr: string,
  limit = 20
): TaskSummary[] {
  const searchPattern = `%${queryStr}%`;
  
  interface QuickSearchRow extends TaskSummaryRow {
    description: string | null;
  }

  const rows = dbQuery<QuickSearchRow>(
    `SELECT ts.*, t.description
     FROM task_summary ts
     JOIN tasks t ON ts.id = t.id
     WHERE ts.name LIKE ?
        OR t.description LIKE ?
        OR ts.list_name LIKE ?
     ORDER BY
       CASE
         WHEN ts.name LIKE ? THEN 1
         WHEN t.description LIKE ? THEN 2
         ELSE 3
       END,
       t.created_at DESC
     LIMIT ?`,
    [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isCompleted: Boolean(row.is_completed),
    priority: row.priority,
    taskDate: row.task_date,
    deadline: row.deadline,
    listId: row.list_id,
    listName: row.list_name,
    listColor: row.list_color,
    labelCount: row.label_count,
    totalSubtasks: row.total_subtasks,
    completedSubtasks: row.completed_subtasks,
    attachmentCount: row.attachment_count,
  }));
}

/**
 * Search labels using Fuse.js
 */
export function searchLabels(
  queryStr: string,
  limit = 10
): Array<{ item: Label; score: number }> {
  const rows = dbQuery<LabelRow>("SELECT * FROM labels ORDER BY name ASC");

  const labels = rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  }));

  const fuse = new Fuse(labels, labelFuseOptions);
  const results = fuse.search(queryStr);

  return results.slice(0, limit).map((result) => ({
    item: result.item,
    score: result.score ?? 1,
  }));
}

/**
 * Global search across all entities
 */
export function globalSearch(
  queryStr: string,
  limit = 20
): {
  tasks: Array<{ item: TaskSummary; score: number }>;
  labels: Array<{ item: Label; score: number }>;
} {
  return {
    tasks: searchTasks(queryStr, { limit }),
    labels: searchLabels(queryStr, limit),
  };
}

/**
 * Search within a specific list
 */
export function searchInList(
  listId: number,
  queryStr: string,
  limit = 20
): Array<{ item: TaskSummary; score: number }> {
  return searchTasks(queryStr, { listId, limit });
}

/**
 * Get search suggestions (autocomplete)
 */
export function getSearchSuggestions(
  queryStr: string,
  limit = 10
): string[] {
  const searchPattern = `${queryStr}%`;
  
  const taskResults = dbQuery<{ name: string }>(
    "SELECT DISTINCT name FROM tasks WHERE name LIKE ? ORDER BY name LIMIT ?",
    [searchPattern, limit]
  );

  const labelResults = dbQuery<{ name: string }>(
    "SELECT DISTINCT name FROM labels WHERE name LIKE ? ORDER BY name LIMIT ?",
    [searchPattern, limit]
  );

  const suggestions = new Set<string>();
  taskResults.forEach((r) => suggestions.add(r.name));
  labelResults.forEach((r) => suggestions.add(r.name));

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Advanced search with multiple filters
 */
export function advancedSearch(options: {
  query?: string;
  listId?: number;
  labelIds?: number[];
  priority?: string;
  isCompleted?: boolean;
  hasDueDate?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): TaskSummary[] {
  const {
    query,
    listId,
    labelIds,
    priority,
    isCompleted,
    hasDueDate,
    dateFrom,
    dateTo,
    limit = 50,
  } = options;

  let sql = `
    SELECT DISTINCT ts.*
    FROM task_summary ts
    JOIN tasks t ON ts.id = t.id
  `;
  
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (listId !== undefined) {
    conditions.push("ts.list_id = ?");
    params.push(listId);
  }

  if (priority !== undefined) {
    conditions.push("ts.priority = ?");
    params.push(priority);
  }

  if (isCompleted !== undefined) {
    conditions.push("ts.is_completed = ?");
    params.push(isCompleted ? 1 : 0);
  }

  if (hasDueDate === true) {
    conditions.push("t.task_date IS NOT NULL");
  } else if (hasDueDate === false) {
    conditions.push("t.task_date IS NULL");
  }

  if (dateFrom !== undefined) {
    conditions.push("t.task_date >= ?");
    params.push(dateFrom);
  }

  if (dateTo !== undefined) {
    conditions.push("t.task_date <= ?");
    params.push(dateTo);
  }

  if (labelIds !== undefined && labelIds.length > 0) {
    const placeholders = labelIds.map(() => "?").join(",");
    sql += ` JOIN task_labels tl ON t.id = tl.task_id`;
    conditions.push(`tl.label_id IN (${placeholders})`);
    params.push(...labelIds);
  }

  if (query !== undefined && query.trim() !== "") {
    conditions.push("(ts.name LIKE ? OR t.description LIKE ?)");
    const pattern = `%${query}%`;
    params.push(pattern, pattern);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY t.created_at DESC LIMIT ?";
  params.push(limit);

  const resultRows = dbQuery<TaskSummaryRow>(sql, params);

  return resultRows.map((row) => ({
    id: row.id,
    name: row.name,
    isCompleted: Boolean(row.is_completed),
    priority: row.priority,
    taskDate: row.task_date,
    deadline: row.deadline,
    listId: row.list_id,
    listName: row.list_name,
    listColor: row.list_color,
    labelCount: row.label_count,
    totalSubtasks: row.total_subtasks,
    completedSubtasks: row.completed_subtasks,
    attachmentCount: row.attachment_count,
  }));
}
