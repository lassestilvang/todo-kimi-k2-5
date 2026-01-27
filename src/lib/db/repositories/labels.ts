/**
 * Labels Repository
 * CRUD operations for labels
 */

import { query, queryOne, run, transaction } from "@/lib/db";
import type { Label, LabelRow, CreateLabelInput, UpdateLabelInput } from "@/lib/types";

/**
 * Convert database row to Label object
 */
function mapRowToLabel(row: LabelRow): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  };
}

/**
 * Get all labels ordered by name
 */
export function getAllLabels(): Label[] {
  const rows = query<LabelRow>("SELECT * FROM labels ORDER BY name ASC");
  return rows.map(mapRowToLabel);
}

/**
 * Get a single label by ID
 */
export function getLabelById(id: number): Label | null {
  const row = queryOne<LabelRow>("SELECT * FROM labels WHERE id = ?", [id]);
  return row ? mapRowToLabel(row) : null;
}

/**
 * Get a label by name
 */
export function getLabelByName(name: string): Label | null {
  const row = queryOne<LabelRow>("SELECT * FROM labels WHERE name = ? COLLATE NOCASE", [name]);
  return row ? mapRowToLabel(row) : null;
}

/**
 * Get labels for a specific task
 */
export function getLabelsByTaskId(taskId: number): Label[] {
  const rows = query<LabelRow>(
    `SELECT l.* FROM labels l
     JOIN task_labels tl ON l.id = tl.label_id
     WHERE tl.task_id = ?
     ORDER BY l.name ASC`,
    [taskId]
  );
  return rows.map(mapRowToLabel);
}

/**
 * Get labels with task count
 */
export function getLabelsWithTaskCount(): (Label & { taskCount: number })[] {
  const rows = query<
    LabelRow & { task_count: number }
  >(
    `SELECT l.*, COUNT(tl.task_id) as task_count 
     FROM labels l 
     LEFT JOIN task_labels tl ON l.id = tl.label_id
     GROUP BY l.id
     ORDER BY l.name ASC`
  );

  return rows.map((row) => ({
    ...mapRowToLabel(row),
    taskCount: row.task_count,
  }));
}

/**
 * Create a new label
 */
export function createLabel(input: CreateLabelInput): Label {
  // Check if label with same name already exists
  const existing = getLabelByName(input.name);
  if (existing) {
    throw new Error(`Label with name "${input.name}" already exists`);
  }

  const { lastInsertRowid } = run(
    "INSERT INTO labels (name, color, icon) VALUES (?, ?, ?)",
    [
      input.name,
      input.color ?? "#8b5cf6",
      input.icon ?? "tag",
    ]
  );

  const label = getLabelById(Number(lastInsertRowid));
  if (!label) {
    throw new Error("Failed to create label");
  }
  return label;
}

/**
 * Update a label
 */
export function updateLabel(id: number, input: UpdateLabelInput): Label | null {
  const existing = getLabelById(id);
  if (!existing) {
    return null;
  }

  // Check for name conflict if renaming
  if (input.name !== undefined && input.name !== existing.name) {
    const conflict = getLabelByName(input.name);
    if (conflict && conflict.id !== id) {
      throw new Error(`Label with name "${input.name}" already exists`);
    }
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
  if (input.icon !== undefined) {
    updates.push("icon = ?");
    values.push(input.icon);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);
  run(`UPDATE labels SET ${updates.join(", ")} WHERE id = ?`, values);

  return getLabelById(id);
}

/**
 * Delete a label
 */
export function deleteLabel(id: number): boolean {
  const result = run("DELETE FROM labels WHERE id = ?", [id]);
  return result.changes > 0;
}

/**
 * Add label to task
 */
export function addLabelToTask(taskId: number, labelId: number): boolean {
  try {
    run("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)", [taskId, labelId]);
    return true;
  } catch {
    // Label already added or constraint violation
    return false;
  }
}

/**
 * Remove label from task
 */
export function removeLabelFromTask(taskId: number, labelId: number): boolean {
  const result = run("DELETE FROM task_labels WHERE task_id = ? AND label_id = ?", [
    taskId,
    labelId,
  ]);
  return result.changes > 0;
}

/**
 * Set labels for a task (replaces all existing labels)
 */
export function setTaskLabels(taskId: number, labelIds: number[]): void {
  transaction((db) => {
    // Remove existing labels
    db.query("DELETE FROM task_labels WHERE task_id = ?").run(taskId);

    // Add new labels
    if (labelIds.length > 0) {
      const stmt = db.query("INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)");
      for (const labelId of labelIds) {
        stmt.run(taskId, labelId);
      }
    }
  });
}

/**
 * Get or create a label by name
 */
export function getOrCreateLabel(name: string, color?: string, icon?: string): Label {
  const existing = getLabelByName(name);
  if (existing) {
    return existing;
  }
  return createLabel({ name, color, icon });
}
