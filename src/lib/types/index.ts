/**
 * Daily Task Planner - TypeScript Type Definitions
 * Based on TECH_SPEC.md and DATABASE_SCHEMA.sql
 */

// ============================================================================
// ENUMS / UNION TYPES
// ============================================================================

export type Priority = "high" | "medium" | "low" | "none";

export type ActivityAction =
  | "created"
  | "updated"
  | "completed"
  | "uncompleted"
  | "moved"
  | "deleted"
  | "attachment_added"
  | "attachment_removed"
  | "subtask_added"
  | "subtask_completed"
  | "reminder_triggered";

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface List {
  id: number;
  name: string;
  color: string;
  emoji: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  listId: number;
  name: string;
  description: string | null;
  taskDate: string | null; // YYYY-MM-DD format
  deadline: string | null; // ISO timestamp
  reminder: string | null; // ISO timestamp
  estimate: string | null; // HH:mm format
  actualTime: string | null; // HH:mm format
  priority: Priority;
  recurrenceRule: RecurrenceRule | null;
  isCompleted: boolean;
  completedAt: string | null; // ISO timestamp
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface Label {
  id: number;
  name: string;
  color: string;
  icon: string; // Lucide icon name
  createdAt: string;
}

export interface TaskLabel {
  taskId: number;
  labelId: number;
}

export interface Subtask {
  id: number;
  taskId: number;
  name: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Attachment {
  id: number;
  taskId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  taskId: number;
  action: ActivityAction;
  oldValue: string | null; // JSON or plain text
  newValue: string | null; // JSON or plain text
  createdAt: string;
}

// ============================================================================
// COMPLEX TYPES
// ============================================================================

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number; // Every N days/weeks/months/years
  daysOfWeek?: number[]; // 0-6 for weekly recurrence
  dayOfMonth?: number; // 1-31 for monthly recurrence
  monthOfYear?: number; // 1-12 for yearly recurrence
  endDate?: string; // ISO date
  occurrences?: number; // Max number of occurrences
}

// ============================================================================
// VIEW TYPES (Database Views)
// ============================================================================

export interface TaskSummary {
  id: number;
  name: string;
  isCompleted: boolean;
  priority: Priority;
  taskDate: string | null;
  deadline: string | null;
  listId: number;
  listName: string;
  listColor: string;
  labelCount: number;
  totalSubtasks: number;
  completedSubtasks: number;
  attachmentCount: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateTaskInput {
  listId: number;
  name: string;
  description?: string | null;
  taskDate?: string | null;
  deadline?: string | null;
  reminder?: string | null;
  estimate?: string | null;
  priority?: Priority;
  recurrenceRule?: RecurrenceRule | null;
  labelIds?: number[];
}

export interface UpdateTaskInput {
  listId?: number;
  name?: string;
  description?: string | null;
  taskDate?: string | null;
  deadline?: string | null;
  reminder?: string | null;
  estimate?: string | null;
  actualTime?: string | null;
  priority?: Priority;
  recurrenceRule?: RecurrenceRule | null;
  isCompleted?: boolean;
  labelIds?: number[];
}

export interface CreateListInput {
  name: string;
  color?: string;
  emoji?: string;
  sortOrder?: number;
}

export interface UpdateListInput {
  name?: string;
  color?: string;
  emoji?: string;
  sortOrder?: number;
}

export interface CreateLabelInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CreateSubtaskInput {
  taskId: number;
  name: string;
  sortOrder?: number;
}

export interface UpdateSubtaskInput {
  name?: string;
  isCompleted?: boolean;
  sortOrder?: number;
}

// ============================================================================
// FILTER / QUERY TYPES
// ============================================================================

export interface TaskFilter {
  listId?: number;
  labelIds?: number[];
  priority?: Priority;
  isCompleted?: boolean;
  taskDate?: string; // Specific date
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

export type TaskView = "today" | "upcoming" | "next7" | "all" | "completed";

// ============================================================================
// UI / STATE TYPES
// ============================================================================

export interface SidebarState {
  isCollapsed: boolean;
  width: number;
}

export interface ThemeSettings {
  mode: "light" | "dark" | "system";
}

// ============================================================================
// DATABASE ROW TYPES (Snake_case from DB)
// ============================================================================

export interface ListRow {
  id: number;
  name: string;
  color: string;
  emoji: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: number;
  list_id: number;
  name: string;
  description: string | null;
  task_date: string | null;
  deadline: string | null;
  reminder: string | null;
  estimate: string | null;
  actual_time: string | null;
  priority: Priority;
  recurrence_rule: string | null; // JSON string
  is_completed: number; // SQLite boolean (0/1)
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabelRow {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface SubtaskRow {
  id: number;
  task_id: number;
  name: string;
  is_completed: number; // SQLite boolean (0/1)
  sort_order: number;
  created_at: string;
}

export interface AttachmentRow {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ActivityLogRow {
  id: number;
  task_id: number;
  action: ActivityAction;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}
