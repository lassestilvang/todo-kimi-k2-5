/**
 * Zod Validation Schemas
 * Based on TypeScript types and database constraints
 */

import { z } from "zod";

// ============================================================================
// ENUM VALIDATIONS
// ============================================================================

export const PrioritySchema = z.enum(["high", "medium", "low", "none"]);

export const ActivityActionSchema = z.enum([
  "created",
  "updated",
  "completed",
  "uncompleted",
  "moved",
  "deleted",
  "attachment_added",
  "attachment_removed",
  "subtask_added",
  "subtask_completed",
  "reminder_triggered",
]);

// ============================================================================
// HELPER SCHEMAS
// ============================================================================

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g., #6366f1)");

export const TimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Must be in HH:mm format");

export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format");

export const EmojiSchema = z
  .string()
  .max(2, "Emoji must be a single character");

export const RecurrenceRuleSchema = z
  .object({
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int().positive().optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    monthOfYear: z.number().int().min(1).max(12).optional(),
    endDate: z.string().datetime().optional(),
    occurrences: z.number().int().positive().optional(),
  })
  .nullable();

// ============================================================================
// ENTITY SCHEMAS
// ============================================================================

export const ListSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  color: HexColorSchema,
  emoji: EmojiSchema,
  sortOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TaskSchema = z.object({
  id: z.number().int().positive(),
  listId: z.number().int().positive(),
  name: z.string().min(1).max(500),
  description: z.string().max(10000).nullable(),
  taskDate: DateStringSchema.nullable(),
  deadline: z.string().datetime().nullable(),
  reminder: z.string().datetime().nullable(),
  estimate: TimeSchema.nullable(),
  actualTime: TimeSchema.nullable(),
  priority: PrioritySchema,
  recurrenceRule: RecurrenceRuleSchema,
  isCompleted: z.boolean(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const LabelSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(50),
  color: HexColorSchema,
  icon: z.string().min(1).default("tag"),
  createdAt: z.string().datetime(),
});

export const SubtaskSchema = z.object({
  id: z.number().int().positive(),
  taskId: z.number().int().positive(),
  name: z.string().min(1).max(500),
  isCompleted: z.boolean(),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
});

export const AttachmentSchema = z.object({
  id: z.number().int().positive(),
  taskId: z.number().int().positive(),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const ActivityLogSchema = z.object({
  id: z.number().int().positive(),
  taskId: z.number().int().positive(),
  action: ActivityActionSchema,
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  createdAt: z.string().datetime(),
});

// ============================================================================
// INPUT SCHEMAS (for API requests)
// ============================================================================

export const CreateListInputSchema = z.object({
  name: z.string().min(1).max(100),
  color: HexColorSchema.optional().default("#6366f1"),
  emoji: EmojiSchema.optional().default("📥"),
  sortOrder: z.number().int().optional().default(0),
});

export const UpdateListInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: HexColorSchema.optional(),
  emoji: EmojiSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const CreateTaskInputSchema = z.object({
  listId: z.number().int().positive(),
  name: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
  taskDate: DateStringSchema.optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  reminder: z.string().datetime().optional().nullable(),
  estimate: TimeSchema.optional().nullable(),
  priority: PrioritySchema.optional().default("none"),
  recurrenceRule: RecurrenceRuleSchema.optional().nullable(),
  labelIds: z.array(z.number().int().positive()).optional(),
});

export const UpdateTaskInputSchema = z.object({
  listId: z.number().int().positive().optional(),
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  taskDate: DateStringSchema.optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  reminder: z.string().datetime().optional().nullable(),
  estimate: TimeSchema.optional().nullable(),
  actualTime: TimeSchema.optional().nullable(),
  priority: PrioritySchema.optional(),
  recurrenceRule: RecurrenceRuleSchema.optional().nullable(),
  isCompleted: z.boolean().optional(),
  labelIds: z.array(z.number().int().positive()).optional(),
});

export const CreateLabelInputSchema = z.object({
  name: z.string().min(1).max(50),
  color: HexColorSchema.optional().default("#8b5cf6"),
  icon: z.string().min(1).optional().default("tag"),
});

export const UpdateLabelInputSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: HexColorSchema.optional(),
  icon: z.string().min(1).optional(),
});

export const CreateSubtaskInputSchema = z.object({
  taskId: z.number().int().positive(),
  name: z.string().min(1).max(500),
  sortOrder: z.number().int().optional().default(0),
});

export const UpdateSubtaskInputSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  isCompleted: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const CreateAttachmentInputSchema = z.object({
  taskId: z.number().int().positive(),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const TaskFilterSchema = z.object({
  listId: z.number().int().positive().optional(),
  labelIds: z.array(z.number().int().positive()).optional(),
  priority: PrioritySchema.optional(),
  isCompleted: z.boolean().optional(),
  taskDate: DateStringSchema.optional(),
  dateRange: z
    .object({
      start: DateStringSchema,
      end: DateStringSchema,
    })
    .optional(),
  searchQuery: z.string().optional(),
});

export const TaskViewSchema = z.enum([
  "today",
  "upcoming",
  "next7",
  "all",
  "completed",
]);

// ============================================================================
// QUERY PARAM SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  ...PaginationSchema.shape,
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type PriorityType = z.infer<typeof PrioritySchema>;
export type ActivityActionType = z.infer<typeof ActivityActionSchema>;
export type RecurrenceRuleType = z.infer<typeof RecurrenceRuleSchema>;
export type CreateListInputType = z.infer<typeof CreateListInputSchema>;
export type UpdateListInputType = z.infer<typeof UpdateListInputSchema>;
export type CreateTaskInputType = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInputType = z.infer<typeof UpdateTaskInputSchema>;
export type CreateLabelInputType = z.infer<typeof CreateLabelInputSchema>;
export type UpdateLabelInputType = z.infer<typeof UpdateLabelInputSchema>;
export type CreateSubtaskInputType = z.infer<typeof CreateSubtaskInputSchema>;
export type UpdateSubtaskInputType = z.infer<typeof UpdateSubtaskInputSchema>;
export type CreateAttachmentInputType = z.infer<typeof CreateAttachmentInputSchema>;
export type TaskFilterType = z.infer<typeof TaskFilterSchema>;
export type TaskViewType = z.infer<typeof TaskViewSchema>;
export type PaginationType = z.infer<typeof PaginationSchema>;
export type SearchQueryType = z.infer<typeof SearchQuerySchema>;
