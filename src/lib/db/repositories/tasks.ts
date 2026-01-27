/**
 * Tasks Repository
 * CRUD operations for tasks with filtering and label management
 */

import { query, queryOne, run, transaction } from "@/lib/db";
import type {
  Task,
  TaskRow,
  TaskSummary,
  TaskSummaryRow,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilter,
  Priority,
  Label,
  LabelRow,
} from "@/lib/types";

/**
 * Convert database row to Task object
 */
function mapRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    description: row.description,
    taskDate: row.task_date,
    deadline: row.deadline,
    reminder: row.reminder,
    estimate: row.estimate,
    actualTime: row.actual_time,
    priority: row.priority,
    recurrenceRule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : null,
    isCompleted: Boolean(row.is_completed),
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to TaskSummary object
 */
function mapRowToTaskSummary(row: TaskSummaryRow): TaskSummary {
  return {
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
  };
}

/**
 * Build WHERE clause from filter
 */
function buildTaskFilter(filter: TaskFilter): { where: string; params: (string | number)[] } {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter.listId !== undefined) {
    conditions.push("t.list_id = ?");
    params.push(filter.listId);
  }

  if (filter.priority !== undefined) {
    conditions.push("t.priority = ?");
    params.push(filter.priority);
  }

  if (filter.isCompleted !== undefined) {
    conditions.push("t.is_completed = ?");
    params.push(filter.isCompleted ? 1 : 0);
  }

  if (filter.taskDate !== undefined) {
    conditions.push("t.task_date = ?");
    params.push(filter.taskDate);
  }

  if (filter.dateRange !== undefined) {
    conditions.push("t.task_date >= ? AND t.task_date <= ?");
    params.push(filter.dateRange.start, filter.dateRange.end);
  }

  if (filter.labelIds !== undefined && filter.labelIds.length > 0) {
    const placeholders = filter.labelIds.map(() => "?").join(",");
    conditions.push(
      `t.id IN (SELECT task_id FROM task_labels WHERE label_id IN (${placeholders}))`
    );
    params.push(...filter.labelIds);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

/**
 * Get task by ID with all details
 */
export function getTaskById(id: number): Task | null {
  const row = queryOne<TaskRow>("SELECT * FROM tasks WHERE id = ?", [id]);
  return row ? mapRowToTask(row) : null;
}

/**
 * Get task summary by ID
 */
export function getTaskSummaryById(id: number): TaskSummary | null {
  const row = queryOne<TaskSummaryRow>(
    "SELECT * FROM task_summary WHERE id = ?",
    [id]
  );
  return row ? mapRowToTaskSummary(row) : null;
}

/**
 * Get all tasks with optional filtering
 */
export function getTasks(filter: TaskFilter = {}): Task[] {
  const { where, params } = buildTaskFilter(filter);
  const sql = `SELECT * FROM tasks t ${where} ORDER BY t.created_at DESC`;
  const rows = query<TaskRow>(sql, params);
  return rows.map(mapRowToTask);
}

/**
 * Get task summaries with optional filtering
 */
export function getTaskSummaries(filter: TaskFilter = {}): TaskSummary[] {
  const { where, params } = buildTaskFilter(filter);
  // Build from task_summary view - need to adjust column names
  const sql = `
    SELECT
      ts.*
    FROM task_summary ts
    JOIN tasks t ON ts.id = t.id
    ${where}
    ORDER BY t.created_at DESC
  `;
  const rows = query<TaskSummaryRow>(sql, params);
  return rows.map(mapRowToTaskSummary);
}

/**
 * Get tasks for a specific list
 */
export function getTasksByListId(listId: number, includeCompleted = false): TaskSummary[] {
  // Need to join with tasks table to get created_at for ordering
  const sql = includeCompleted
    ? `SELECT ts.* FROM task_summary ts
       JOIN tasks t ON ts.id = t.id
       WHERE ts.list_id = ?
       ORDER BY t.created_at DESC`
    : `SELECT ts.* FROM task_summary ts
       JOIN tasks t ON ts.id = t.id
       WHERE ts.list_id = ? AND ts.is_completed = 0
       ORDER BY t.created_at DESC`;
  
  const rows = query<TaskSummaryRow>(sql, [listId]);
  return rows.map(mapRowToTaskSummary);
}

/**
 * Get today's tasks
 */
export function getTodaysTasks(): TaskSummary[] {
  // Join with tasks to get created_at for ordering
  const rows = query<TaskSummaryRow>(`
    SELECT ts.* FROM todays_tasks ts
    JOIN tasks t ON ts.id = t.id
    ORDER BY ts.priority DESC, t.created_at DESC
  `);
  return rows.map(mapRowToTaskSummary);
}

/**
 * Get upcoming tasks (next 7 days)
 */
export function getUpcomingTasks(): TaskSummary[] {
  const rows = query<TaskSummaryRow>("SELECT * FROM upcoming_tasks");
  return rows.map(mapRowToTaskSummary);
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(): TaskSummary[] {
  const rows = query<TaskSummaryRow>("SELECT * FROM overdue_tasks");
  return rows.map(mapRowToTaskSummary);
}

/**
 * Get completed tasks
 */
export function getCompletedTasks(limit = 50): TaskSummary[] {
  const rows = query<TaskSummaryRow>(
    "SELECT * FROM task_summary WHERE is_completed = 1 ORDER BY completed_at DESC LIMIT ?",
    [limit]
  );
  return rows.map(mapRowToTaskSummary);
}

/**
 * Get labels for a task
 */
export function getTaskLabels(taskId: number): Label[] {
  const rows = query<LabelRow>(
    `SELECT l.* FROM labels l
     JOIN task_labels tl ON l.id = tl.label_id
     WHERE tl.task_id = ?
     ORDER BY l.name`,
    [taskId]
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  }));
}

/**
 * Create a new task with optional labels
 */
export function createTask(input: CreateTaskInput): Task {
  return transaction((db) => {
    // Insert task
    const { lastInsertRowid } = db
      .query(
        `INSERT INTO tasks (
          list_id, name, description, task_date, deadline, 
          reminder, estimate, priority, recurrence_rule
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.listId,
        input.name,
        input.description ?? null,
        input.taskDate ?? null,
        input.deadline ?? null,
        input.reminder ?? null,
        input.estimate ?? null,
        input.priority ?? "none",
        input.recurrenceRule ? JSON.stringify(input.recurrenceRule) : null
      );

    const taskId = Number(lastInsertRowid);

    // Add labels if provided
    if (input.labelIds && input.labelIds.length > 0) {
      const stmt = db.query("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
      for (const labelId of input.labelIds) {
        stmt.run(taskId, labelId);
      }
    }

    const task = getTaskById(taskId);
    if (!task) {
      throw new Error("Failed to create task");
    }
    return task;
  });
}

/**
 * Update a task
 */
export function updateTask(id: number, input: UpdateTaskInput): Task | null {
  return transaction((db) => {
    const existing = getTaskById(id);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.listId !== undefined) {
      updates.push("list_id = ?");
      values.push(input.listId);
    }
    if (input.name !== undefined) {
      updates.push("name = ?");
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push("description = ?");
      values.push(input.description);
    }
    if (input.taskDate !== undefined) {
      updates.push("task_date = ?");
      values.push(input.taskDate);
    }
    if (input.deadline !== undefined) {
      updates.push("deadline = ?");
      values.push(input.deadline);
    }
    if (input.reminder !== undefined) {
      updates.push("reminder = ?");
      values.push(input.reminder);
    }
    if (input.estimate !== undefined) {
      updates.push("estimate = ?");
      values.push(input.estimate);
    }
    if (input.actualTime !== undefined) {
      updates.push("actual_time = ?");
      values.push(input.actualTime);
    }
    if (input.priority !== undefined) {
      updates.push("priority = ?");
      values.push(input.priority);
    }
    if (input.recurrenceRule !== undefined) {
      updates.push("recurrence_rule = ?");
      values.push(input.recurrenceRule ? JSON.stringify(input.recurrenceRule) : null);
    }
    if (input.isCompleted !== undefined) {
      updates.push("is_completed = ?");
      values.push(input.isCompleted ? 1 : 0);
      if (input.isCompleted) {
        updates.push("completed_at = CURRENT_TIMESTAMP");
      } else {
        updates.push("completed_at = NULL");
      }
    }

    if (updates.length > 0) {
      values.push(id);
      db.query(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    }

    // Update labels if provided
    if (input.labelIds !== undefined) {
      // Remove existing labels
      db.query("DELETE FROM task_labels WHERE task_id = ?").run(id);

      // Add new labels
      if (input.labelIds.length > 0) {
        const stmt = db.query("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
        for (const labelId of input.labelIds) {
          stmt.run(id, labelId);
        }
      }
    }

    return getTaskById(id);
  });
}

/**
 * Toggle task completion status
 */
export function toggleTaskCompletion(id: number): Task | null {
  const task = getTaskById(id);
  if (!task) {
    return null;
  }

  const newCompletedStatus = !task.isCompleted;
  
  run(
    `UPDATE tasks 
     SET is_completed = ?, completed_at = ${newCompletedStatus ? "CURRENT_TIMESTAMP" : "NULL"}
     WHERE id = ?`,
    [newCompletedStatus ? 1 : 0, id]
  );

  return getTaskById(id);
}

/**
 * Delete a task
 */
export function deleteTask(id: number): boolean {
  const result = run("DELETE FROM tasks WHERE id = ?", [id]);
  return result.changes > 0;
}

/**
 * Move task to a different list
 */
export function moveTaskToList(taskId: number, listId: number): Task | null {
  run("UPDATE tasks SET list_id = ? WHERE id = ?", [listId, taskId]);
  return getTaskById(taskId);
}

/**
 * Get tasks by view type
 */
export function getTasksByView(view: "today" | "upcoming" | "next7" | "all" | "completed"): TaskSummary[] {
  switch (view) {
    case "today":
      return getTodaysTasks();
    case "upcoming":
      return getUpcomingTasks();
    case "next7":
      return getUpcomingTasks();
    case "completed":
      return getCompletedTasks();
    case "all":
    default:
      return getTaskSummaries();
  }
}
