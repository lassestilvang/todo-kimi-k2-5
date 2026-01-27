/**
 * Activity Repository
 * CRUD operations for activity logs
 */

import { query, queryOne, run } from "@/lib/db";
import type { ActivityLog, ActivityLogRow, ActivityAction } from "@/lib/types";

/**
 * Convert database row to ActivityLog object
 */
function mapRowToActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    taskId: row.task_id,
    action: row.action,
    oldValue: row.old_value,
    newValue: row.new_value,
    createdAt: row.created_at,
  };
}

/**
 * Get activity logs for a task
 */
export function getActivityByTaskId(taskId: number, limit = 50): ActivityLog[] {
  const rows = query<ActivityLogRow>(
    "SELECT * FROM activity_logs WHERE task_id = ? ORDER BY created_at DESC LIMIT ?",
    [taskId, limit]
  );
  return rows.map(mapRowToActivityLog);
}

/**
 * Get a single activity log by ID
 */
export function getActivityById(id: number): ActivityLog | null {
  const row = queryOne<ActivityLogRow>("SELECT * FROM activity_logs WHERE id = ?", [id]);
  return row ? mapRowToActivityLog(row) : null;
}

/**
 * Get recent activity across all tasks
 */
export function getRecentActivity(limit = 50): ActivityLog[] {
  const rows = query<ActivityLogRow>(
    "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return rows.map(mapRowToActivityLog);
}

/**
 * Get activity by action type
 */
export function getActivityByAction(action: ActivityAction, limit = 50): ActivityLog[] {
  const rows = query<ActivityLogRow>(
    "SELECT * FROM activity_logs WHERE action = ? ORDER BY created_at DESC LIMIT ?",
    [action, limit]
  );
  return rows.map(mapRowToActivityLog);
}

/**
 * Get activity for tasks in a list
 */
export function getActivityByListId(listId: number, limit = 50): ActivityLog[] {
  const rows = query<ActivityLogRow>(
    `SELECT al.* FROM activity_logs al
     JOIN tasks t ON al.task_id = t.id
     WHERE t.list_id = ?
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [listId, limit]
  );
  return rows.map(mapRowToActivityLog);
}

/**
 * Create an activity log entry
 */
export function createActivityLog(
  taskId: number,
  action: ActivityAction,
  oldValue: string | null = null,
  newValue: string | null = null
): ActivityLog {
  const { lastInsertRowid } = run(
    "INSERT INTO activity_logs (task_id, action, old_value, new_value) VALUES (?, ?, ?, ?)",
    [taskId, action, oldValue, newValue]
  );

  const log = getActivityById(Number(lastInsertRowid));
  if (!log) {
    throw new Error("Failed to create activity log");
  }
  return log;
}

/**
 * Delete old activity logs (for cleanup)
 */
export function deleteOldActivityLogs(olderThanDays: number): number {
  const result = run(
    "DELETE FROM activity_logs WHERE created_at < datetime('now', '-' || ? || ' days')",
    [olderThanDays]
  );
  return result.changes;
}

/**
 * Delete activity logs for a task
 */
export function deleteActivityByTaskId(taskId: number): number {
  const result = run("DELETE FROM activity_logs WHERE task_id = ?", [taskId]);
  return result.changes;
}

/**
 * Get activity count for a task
 */
export function getActivityCount(taskId: number): number {
  const result = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM activity_logs WHERE task_id = ?",
    [taskId]
  );
  return result?.count ?? 0;
}

/**
 * Get activity statistics
 */
export function getActivityStats(): {
  total: number;
  byAction: Record<ActivityAction, number>;
} {
  const total = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM activity_logs"
  );

  const byActionRows = query<{ action: ActivityAction; count: number }>(
    "SELECT action, COUNT(*) as count FROM activity_logs GROUP BY action"
  );

  const byAction: Record<ActivityAction, number> = {
    created: 0,
    updated: 0,
    completed: 0,
    uncompleted: 0,
    moved: 0,
    deleted: 0,
    attachment_added: 0,
    attachment_removed: 0,
    subtask_added: 0,
    subtask_completed: 0,
    reminder_triggered: 0,
  };

  for (const row of byActionRows) {
    byAction[row.action] = row.count;
  }

  return {
    total: total?.count ?? 0,
    byAction,
  };
}

/**
 * Get activity for a date range
 */
export function getActivityByDateRange(
  startDate: string,
  endDate: string,
  limit = 100
): ActivityLog[] {
  const rows = query<ActivityLogRow>(
    `SELECT * FROM activity_logs 
     WHERE created_at >= ? AND created_at <= ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [startDate, endDate, limit]
  );
  return rows.map(mapRowToActivityLog);
}

/**
 * Get human-readable activity description
 */
export function getActivityDescription(log: ActivityLog): string {
  const actionDescriptions: Record<ActivityAction, string> = {
    created: "Task created",
    updated: "Task updated",
    completed: "Task completed",
    uncompleted: "Task marked as incomplete",
    moved: "Task moved to another list",
    deleted: "Task deleted",
    attachment_added: `Attachment added: ${log.newValue ?? ""}`,
    attachment_removed: `Attachment removed: ${log.oldValue ?? ""}`,
    subtask_added: `Subtask added: ${log.newValue ?? ""}`,
    subtask_completed: `Subtask completed: ${log.oldValue ?? ""}`,
    reminder_triggered: "Reminder triggered",
  };

  return actionDescriptions[log.action] ?? `Unknown action: ${log.action}`;
}
