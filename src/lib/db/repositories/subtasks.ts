/**
 * Subtasks Repository
 * CRUD operations for subtasks
 */

import { query, queryOne, run, transaction } from "@/lib/db";
import type { Subtask, SubtaskRow, CreateSubtaskInput, UpdateSubtaskInput } from "@/lib/types";

/**
 * Convert database row to Subtask object
 */
function mapRowToSubtask(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    taskId: row.task_id,
    name: row.name,
    isCompleted: Boolean(row.is_completed),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/**
 * Get all subtasks for a task
 */
export function getSubtasksByTaskId(taskId: number): Subtask[] {
  const rows = query<SubtaskRow>(
    "SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC, created_at ASC",
    [taskId]
  );
  return rows.map(mapRowToSubtask);
}

/**
 * Get a single subtask by ID
 */
export function getSubtaskById(id: number): Subtask | null {
  const row = queryOne<SubtaskRow>("SELECT * FROM subtasks WHERE id = ?", [id]);
  return row ? mapRowToSubtask(row) : null;
}

/**
 * Get subtask count for a task
 */
export function getSubtaskCount(taskId: number): { total: number; completed: number } {
  const result = queryOne<{ total: number; completed: number }>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
     FROM subtasks 
     WHERE task_id = ?`,
    [taskId]
  );
  return result ?? { total: 0, completed: 0 };
}

/**
 * Create a new subtask
 */
export function createSubtask(input: CreateSubtaskInput): Subtask {
  // Get max sort order for the task
  const maxOrder = queryOne<{ max_order: number }>(
    "SELECT MAX(sort_order) as max_order FROM subtasks WHERE task_id = ?",
    [input.taskId]
  );
  const sortOrder = input.sortOrder ?? (maxOrder?.max_order ?? -1) + 1;

  const { lastInsertRowid } = run(
    "INSERT INTO subtasks (task_id, name, sort_order) VALUES (?, ?, ?)",
    [input.taskId, input.name, sortOrder]
  );

  const subtask = getSubtaskById(Number(lastInsertRowid));
  if (!subtask) {
    throw new Error("Failed to create subtask");
  }

  // Log activity
  run(
    "INSERT INTO activity_logs (task_id, action, old_value, new_value) VALUES (?, ?, NULL, ?)",
    [input.taskId, "subtask_added", input.name]
  );

  return subtask;
}

/**
 * Create multiple subtasks at once
 */
export function createSubtasks(taskId: number, names: string[]): Subtask[] {
  return transaction((db) => {
    // Get current max sort order
    const maxOrder = db
      .query("SELECT MAX(sort_order) as max_order FROM subtasks WHERE task_id = ?")
      .get(taskId) as { max_order: number } | undefined;
    
    let sortOrder = (maxOrder?.max_order ?? -1) + 1;
    const subtasks: Subtask[] = [];
    const insertStmt = db.query(
      "INSERT INTO subtasks (task_id, name, sort_order) VALUES (?, ?, ?)"
    );
    const activityStmt = db.query(
      "INSERT INTO activity_logs (task_id, action, old_value, new_value) VALUES (?, ?, NULL, ?)"
    );

    for (const name of names) {
      const { lastInsertRowid } = insertStmt.run(taskId, name, sortOrder++);
      const subtask = getSubtaskById(Number(lastInsertRowid));
      if (subtask) {
        subtasks.push(subtask);
      }
      activityStmt.run(taskId, "subtask_added", name);
    }

    return subtasks;
  });
}

/**
 * Update a subtask
 */
export function updateSubtask(id: number, input: UpdateSubtaskInput): Subtask | null {
  const existing = getSubtaskById(id);
  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.name !== undefined) {
    updates.push("name = ?");
    values.push(input.name);
  }
  if (input.isCompleted !== undefined) {
    updates.push("is_completed = ?");
    values.push(input.isCompleted ? 1 : 0);
  }
  if (input.sortOrder !== undefined) {
    updates.push("sort_order = ?");
    values.push(input.sortOrder);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);
  run(`UPDATE subtasks SET ${updates.join(", ")} WHERE id = ?`, values);

  return getSubtaskById(id);
}

/**
 * Toggle subtask completion
 */
export function toggleSubtaskCompletion(id: number): Subtask | null {
  const subtask = getSubtaskById(id);
  if (!subtask) {
    return null;
  }

  const newStatus = !subtask.isCompleted;
  run("UPDATE subtasks SET is_completed = ? WHERE id = ?", [newStatus ? 1 : 0, id]);

  return getSubtaskById(id);
}

/**
 * Delete a subtask
 */
export function deleteSubtask(id: number): boolean {
  const result = run("DELETE FROM subtasks WHERE id = ?", [id]);
  return result.changes > 0;
}

/**
 * Delete all subtasks for a task
 */
export function deleteSubtasksByTaskId(taskId: number): number {
  const result = run("DELETE FROM subtasks WHERE task_id = ?", [taskId]);
  return result.changes;
}

/**
 * Reorder subtasks
 */
export function reorderSubtasks(taskId: number, subtaskIds: number[]): void {
  transaction((db) => {
    const stmt = db.query("UPDATE subtasks SET sort_order = ? WHERE id = ? AND task_id = ?");
    subtaskIds.forEach((id, index) => {
      stmt.run(index, id, taskId);
    });
  });
}

/**
 * Check if all subtasks are completed
 */
export function areAllSubtasksCompleted(taskId: number): boolean {
  const result = queryOne<{ all_completed: number }>(
    `SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        WHEN SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) = 0 THEN 1
        ELSE 0
      END as all_completed
     FROM subtasks 
     WHERE task_id = ?`,
    [taskId]
  );
  return result?.all_completed === 1;
}
