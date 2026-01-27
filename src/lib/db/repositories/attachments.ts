/**
 * Attachments Repository
 * CRUD operations for task attachments
 */

import { query, queryOne, run, transaction } from "@/lib/db";
import type { Attachment, AttachmentRow, CreateAttachmentInput } from "@/lib/types";

/**
 * Convert database row to Attachment object
 */
function mapRowToAttachment(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    taskId: row.task_id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    createdAt: row.created_at,
  };
}

/**
 * Get all attachments for a task
 */
export function getAttachmentsByTaskId(taskId: number): Attachment[] {
  const rows = query<AttachmentRow>(
    "SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC",
    [taskId]
  );
  return rows.map(mapRowToAttachment);
}

/**
 * Get a single attachment by ID
 */
export function getAttachmentById(id: number): Attachment | null {
  const row = queryOne<AttachmentRow>("SELECT * FROM attachments WHERE id = ?", [id]);
  return row ? mapRowToAttachment(row) : null;
}

/**
 * Get attachment count for a task
 */
export function getAttachmentCount(taskId: number): number {
  const result = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM attachments WHERE task_id = ?",
    [taskId]
  );
  return result?.count ?? 0;
}

/**
 * Get total attachment size for a task
 */
export function getTotalAttachmentSize(taskId: number): number {
  const result = queryOne<{ total_size: number }>(
    "SELECT SUM(file_size) as total_size FROM attachments WHERE task_id = ?",
    [taskId]
  );
  return result?.total_size ?? 0;
}

/**
 * Create a new attachment
 */
export function createAttachment(input: CreateAttachmentInput): Attachment {
  const { lastInsertRowid } = run(
    "INSERT INTO attachments (task_id, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)",
    [input.taskId, input.fileName, input.filePath, input.fileSize, input.mimeType]
  );

  const attachment = getAttachmentById(Number(lastInsertRowid));
  if (!attachment) {
    throw new Error("Failed to create attachment");
  }

  // Log activity
  run(
    "INSERT INTO activity_logs (task_id, action, old_value, new_value) VALUES (?, ?, NULL, ?)",
    [input.taskId, "attachment_added", input.fileName]
  );

  return attachment;
}

/**
 * Create multiple attachments at once
 */
export function createAttachments(
  taskId: number,
  attachments: Omit<CreateAttachmentInput, "taskId">[]
): Attachment[] {
  return transaction((db) => {
    const results: Attachment[] = [];
    const insertStmt = db.query(
      "INSERT INTO attachments (task_id, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)"
    );
    const activityStmt = db.query(
      "INSERT INTO activity_logs (task_id, action, old_value, new_value) VALUES (?, ?, NULL, ?)"
    );

    for (const input of attachments) {
      const { lastInsertRowid } = insertStmt.run(
        taskId,
        input.fileName,
        input.filePath,
        input.fileSize,
        input.mimeType
      );
      const attachment = getAttachmentById(Number(lastInsertRowid));
      if (attachment) {
        results.push(attachment);
      }
      activityStmt.run(taskId, "attachment_added", input.fileName);
    }

    return results;
  });
}

/**
 * Delete an attachment
 */
export function deleteAttachment(id: number): boolean {
  const attachment = getAttachmentById(id);
  if (!attachment) {
    return false;
  }

  const result = run("DELETE FROM attachments WHERE id = ?", [id]);
  
  if (result.changes > 0) {
    // Log activity
    run(
      "INSERT INTO activity_logs (task_id, action, old_value, new_value) VALUES (?, ?, ?, NULL)",
      [attachment.taskId, "attachment_removed", attachment.fileName]
    );
    return true;
  }
  
  return false;
}

/**
 * Delete all attachments for a task
 */
export function deleteAttachmentsByTaskId(taskId: number): number {
  const result = run("DELETE FROM attachments WHERE task_id = ?", [taskId]);
  return result.changes;
}

/**
 * Check if attachment exists by file path
 */
export function attachmentExists(taskId: number, filePath: string): boolean {
  const result = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM attachments WHERE task_id = ? AND file_path = ?",
    [taskId, filePath]
  );
  return result?.count === 1;
}

/**
 * Get attachments by MIME type
 */
export function getAttachmentsByMimeType(taskId: number, mimeTypePattern: string): Attachment[] {
  const rows = query<AttachmentRow>(
    "SELECT * FROM attachments WHERE task_id = ? AND mime_type LIKE ? ORDER BY created_at DESC",
    [taskId, mimeTypePattern]
  );
  return rows.map(mapRowToAttachment);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
