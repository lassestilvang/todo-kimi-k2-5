/**
 * Lists Repository
 * CRUD operations for task lists
 */

import { query, queryOne, run, transaction } from "@/lib/db";
import type { List, ListRow, CreateListInput, UpdateListInput } from "@/lib/types";

/**
 * Convert database row to List object
 */
function mapRowToList(row: ListRow): List {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all lists ordered by sort_order
 */
export function getAllLists(): List[] {
  const rows = query<ListRow>(
    "SELECT * FROM lists ORDER BY sort_order ASC, created_at ASC"
  );
  return rows.map(mapRowToList);
}

/**
 * Get a single list by ID
 */
export function getListById(id: number): List | null {
  const row = queryOne<ListRow>("SELECT * FROM lists WHERE id = ?", [id]);
  return row ? mapRowToList(row) : null;
}

/**
 * Create a new list
 */
export function createList(input: CreateListInput): List {
  const { lastInsertRowid } = run(
    `INSERT INTO lists (name, color, emoji, sort_order) 
     VALUES (?, ?, ?, ?)`,
    [
      input.name,
      input.color ?? "#6366f1",
      input.emoji ?? "📥",
      input.sortOrder ?? 0,
    ]
  );

  const list = getListById(Number(lastInsertRowid));
  if (!list) {
    throw new Error("Failed to create list");
  }
  return list;
}

/**
 * Update a list
 */
export function updateList(id: number, input: UpdateListInput): List | null {
  const existing = getListById(id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (input.name !== undefined) {
    updates.push("name = ?");
    values.push(input.name);
  }
  if (input.color !== undefined) {
    updates.push("color = ?");
    values.push(input.color);
  }
  if (input.emoji !== undefined) {
    updates.push("emoji = ?");
    values.push(input.emoji);
  }
  if (input.sortOrder !== undefined) {
    updates.push("sort_order = ?");
    values.push(input.sortOrder);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);
  run(`UPDATE lists SET ${updates.join(", ")} WHERE id = ?`, values);

  return getListById(id);
}

/**
 * Delete a list
 * Note: Tasks in the list will be cascade deleted due to foreign key constraint
 */
export function deleteList(id: number): boolean {
  // Prevent deleting the Inbox list (id = 1)
  if (id === 1) {
    throw new Error("Cannot delete the Inbox list");
  }

  const result = run("DELETE FROM lists WHERE id = ?", [id]);
  return result.changes > 0;
}

/**
 * Update sort order for multiple lists
 */
export function updateListsSortOrder(listIds: number[]): void {
  transaction((db) => {
    const stmt = db.query("UPDATE lists SET sort_order = ? WHERE id = ?");
    listIds.forEach((id, index) => {
      stmt.run(index, id);
    });
  });
}

/**
 * Get list with task count
 */
export function getListWithTaskCount(id: number): (List & { taskCount: number }) | null {
  const row = queryOne<
    ListRow & { task_count: number }
  >(
    `SELECT l.*, COUNT(t.id) as task_count 
     FROM lists l 
     LEFT JOIN tasks t ON l.id = t.list_id AND t.is_completed = 0
     WHERE l.id = ?
     GROUP BY l.id`,
    [id]
  );

  if (!row) {
    return null;
  }

  return {
    ...mapRowToList(row),
    taskCount: row.task_count,
  };
}

/**
 * Get all lists with task counts
 */
export function getAllListsWithTaskCounts(): (List & { taskCount: number })[] {
  const rows = query<
    ListRow & { task_count: number }
  >(
    `SELECT l.*, COUNT(t.id) as task_count 
     FROM lists l 
     LEFT JOIN tasks t ON l.id = t.list_id AND t.is_completed = 0
     GROUP BY l.id
     ORDER BY l.sort_order ASC, l.created_at ASC`
  );

  return rows.map((row) => ({
    ...mapRowToList(row),
    taskCount: row.task_count,
  }));
}
