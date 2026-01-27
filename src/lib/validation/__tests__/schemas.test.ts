/**
 * Validation Schema Tests
 * Tests Zod schema validations
 */

import { describe, test, expect } from "bun:test";
import {
  PrioritySchema,
  HexColorSchema,
  TimeSchema,
  DateStringSchema,
  EmojiSchema,
  RecurrenceRuleSchema,
  ListSchema,
  TaskSchema,
  LabelSchema,
  SubtaskSchema,
  CreateListInputSchema,
  UpdateListInputSchema,
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  CreateLabelInputSchema,
  UpdateLabelInputSchema,
  CreateSubtaskInputSchema,
  UpdateSubtaskInputSchema,
} from "../schemas";

describe("Validation Schemas", () => {
  describe("PrioritySchema", () => {
    test("should accept valid priorities", () => {
      expect(PrioritySchema.safeParse("high").success).toBe(true);
      expect(PrioritySchema.safeParse("medium").success).toBe(true);
      expect(PrioritySchema.safeParse("low").success).toBe(true);
      expect(PrioritySchema.safeParse("none").success).toBe(true);
    });

    test("should reject invalid priorities", () => {
      expect(PrioritySchema.safeParse("urgent").success).toBe(false);
      expect(PrioritySchema.safeParse("").success).toBe(false);
    });
  });

  describe("HexColorSchema", () => {
    test("should accept valid hex colors", () => {
      expect(HexColorSchema.safeParse("#ff0000").success).toBe(true);
      expect(HexColorSchema.safeParse("#6366f1").success).toBe(true);
      expect(HexColorSchema.safeParse("#FFFFFF").success).toBe(true);
    });

    test("should reject invalid hex colors", () => {
      expect(HexColorSchema.safeParse("red").success).toBe(false);
      expect(HexColorSchema.safeParse("#gg0000").success).toBe(false);
      expect(HexColorSchema.safeParse("#fff").success).toBe(false); // 3 chars not allowed
      expect(HexColorSchema.safeParse("").success).toBe(false);
    });
  });

  describe("TimeSchema", () => {
    test("should accept valid HH:mm times", () => {
      expect(TimeSchema.safeParse("14:30").success).toBe(true);
      expect(TimeSchema.safeParse("00:00").success).toBe(true);
      expect(TimeSchema.safeParse("23:59").success).toBe(true);
    });

    test("should reject invalid times", () => {
      expect(TimeSchema.safeParse("24:00").success).toBe(false);
      expect(TimeSchema.safeParse("12:60").success).toBe(false);
      expect(TimeSchema.safeParse("2:30").success).toBe(false);
      expect(TimeSchema.safeParse("14:30:00").success).toBe(false);
    });
  });

  describe("DateStringSchema", () => {
    test("should accept valid YYYY-MM-DD dates", () => {
      expect(DateStringSchema.safeParse("2025-01-15").success).toBe(true);
      expect(DateStringSchema.safeParse("2025-12-31").success).toBe(true);
    });

    test("should reject invalid dates", () => {
      expect(DateStringSchema.safeParse("01-15-2025").success).toBe(false);
      expect(DateStringSchema.safeParse("2025/01/15").success).toBe(false);
      expect(DateStringSchema.safeParse("2025-1-15").success).toBe(false);
    });
  });

  describe("EmojiSchema", () => {
    test("should accept valid emojis", () => {
      expect(EmojiSchema.safeParse("🚀").success).toBe(true);
      expect(EmojiSchema.safeParse("📋").success).toBe(true);
    });

    test("should reject strings that are too long", () => {
      expect(EmojiSchema.safeParse("🚀📋").success).toBe(false);
      expect(EmojiSchema.safeParse("hello").success).toBe(false);
    });
  });

  describe("RecurrenceRuleSchema", () => {
    test("should accept valid recurrence rule", () => {
      expect(RecurrenceRuleSchema.safeParse({
        frequency: "daily",
        interval: 1,
      }).success).toBe(true);

      expect(RecurrenceRuleSchema.safeParse({
        frequency: "weekly",
        daysOfWeek: [1, 3, 5],
      }).success).toBe(true);
    });

    test("should accept null", () => {
      expect(RecurrenceRuleSchema.safeParse(null).success).toBe(true);
    });

    test("should reject invalid frequency", () => {
      expect(RecurrenceRuleSchema.safeParse({
        frequency: "hourly",
      }).success).toBe(false);
    });
  });

  describe("CreateListInputSchema", () => {
    test("should accept valid input", () => {
      expect(CreateListInputSchema.safeParse({
        name: "My List",
        color: "#ff0000",
        emoji: "🚀",
        sortOrder: 0,
      }).success).toBe(true);
    });

    test("should apply defaults", () => {
      const result = CreateListInputSchema.safeParse({ name: "My List" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe("#6366f1");
        expect(result.data.emoji).toBe("📥");
        expect(result.data.sortOrder).toBe(0);
      }
    });

    test("should reject empty name", () => {
      expect(CreateListInputSchema.safeParse({ name: "" }).success).toBe(false);
    });

    test("should reject long name", () => {
      expect(CreateListInputSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
    });
  });

  describe("UpdateListInputSchema", () => {
    test("should accept partial updates", () => {
      expect(UpdateListInputSchema.safeParse({ name: "New Name" }).success).toBe(true);
      expect(UpdateListInputSchema.safeParse({ color: "#ff0000" }).success).toBe(true);
      expect(UpdateListInputSchema.safeParse({}).success).toBe(true);
    });

    test("should reject invalid color", () => {
      expect(UpdateListInputSchema.safeParse({ color: "red" }).success).toBe(false);
    });
  });

  describe("CreateTaskInputSchema", () => {
    test("should accept valid input", () => {
      expect(CreateTaskInputSchema.safeParse({
        listId: 1,
        name: "My Task",
        priority: "high",
        taskDate: "2025-01-15",
        labelIds: [1, 2],
      }).success).toBe(true);
    });

    test("should require listId and name", () => {
      expect(CreateTaskInputSchema.safeParse({ name: "Task" }).success).toBe(false);
      expect(CreateTaskInputSchema.safeParse({ listId: 1 }).success).toBe(false);
    });

    test("should apply defaults", () => {
      const result = CreateTaskInputSchema.safeParse({
        listId: 1,
        name: "Task",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("none");
      }
    });

    test("should reject long name", () => {
      expect(CreateTaskInputSchema.safeParse({
        listId: 1,
        name: "a".repeat(501),
      }).success).toBe(false);
    });
  });

  describe("UpdateTaskInputSchema", () => {
    test("should accept partial updates", () => {
      expect(UpdateTaskInputSchema.safeParse({ name: "New Name" }).success).toBe(true);
      expect(UpdateTaskInputSchema.safeParse({ isCompleted: true }).success).toBe(true);
      expect(UpdateTaskInputSchema.safeParse({}).success).toBe(true);
    });

    test("should reject invalid priority", () => {
      expect(UpdateTaskInputSchema.safeParse({ priority: "urgent" }).success).toBe(false);
    });

    test("should accept valid labelIds", () => {
      expect(UpdateTaskInputSchema.safeParse({ labelIds: [1, 2, 3] }).success).toBe(true);
    });
  });

  describe("CreateLabelInputSchema", () => {
    test("should accept valid input", () => {
      expect(CreateLabelInputSchema.safeParse({
        name: "My Label",
        color: "#ff0000",
        icon: "star",
      }).success).toBe(true);
    });

    test("should apply defaults", () => {
      const result = CreateLabelInputSchema.safeParse({ name: "My Label" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe("#8b5cf6");
        expect(result.data.icon).toBe("tag");
      }
    });

    test("should reject empty name", () => {
      expect(CreateLabelInputSchema.safeParse({ name: "" }).success).toBe(false);
    });

    test("should reject long name", () => {
      expect(CreateLabelInputSchema.safeParse({ name: "a".repeat(51) }).success).toBe(false);
    });
  });

  describe("UpdateLabelInputSchema", () => {
    test("should accept partial updates", () => {
      expect(UpdateLabelInputSchema.safeParse({ name: "New Name" }).success).toBe(true);
      expect(UpdateLabelInputSchema.safeParse({ color: "#ff0000" }).success).toBe(true);
      expect(UpdateLabelInputSchema.safeParse({}).success).toBe(true);
    });
  });

  describe("CreateSubtaskInputSchema", () => {
    test("should accept valid input", () => {
      expect(CreateSubtaskInputSchema.safeParse({
        taskId: 1,
        name: "My Subtask",
        sortOrder: 0,
      }).success).toBe(true);
    });

    test("should require taskId and name", () => {
      expect(CreateSubtaskInputSchema.safeParse({ name: "Subtask" }).success).toBe(false);
      expect(CreateSubtaskInputSchema.safeParse({ taskId: 1 }).success).toBe(false);
    });

    test("should apply default sortOrder", () => {
      const result = CreateSubtaskInputSchema.safeParse({
        taskId: 1,
        name: "Subtask",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortOrder).toBe(0);
      }
    });

    test("should reject long name", () => {
      expect(CreateSubtaskInputSchema.safeParse({
        taskId: 1,
        name: "a".repeat(501),
      }).success).toBe(false);
    });
  });

  describe("UpdateSubtaskInputSchema", () => {
    test("should accept partial updates", () => {
      expect(UpdateSubtaskInputSchema.safeParse({ name: "New Name" }).success).toBe(true);
      expect(UpdateSubtaskInputSchema.safeParse({ isCompleted: true }).success).toBe(true);
      expect(UpdateSubtaskInputSchema.safeParse({ sortOrder: 5 }).success).toBe(true);
      expect(UpdateSubtaskInputSchema.safeParse({}).success).toBe(true);
    });
  });

  describe("Entity Schemas", () => {
    test("ListSchema should validate complete list", () => {
      expect(ListSchema.safeParse({
        id: 1,
        name: "My List",
        color: "#ff0000",
        emoji: "🚀",
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).success).toBe(true);
    });

    test("TaskSchema should validate complete task", () => {
      expect(TaskSchema.safeParse({
        id: 1,
        listId: 1,
        name: "My Task",
        description: null,
        taskDate: "2025-01-15",
        deadline: null,
        reminder: null,
        estimate: null,
        actualTime: null,
        priority: "high",
        recurrenceRule: null,
        isCompleted: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).success).toBe(true);
    });

    test("LabelSchema should validate complete label", () => {
      expect(LabelSchema.safeParse({
        id: 1,
        name: "My Label",
        color: "#ff0000",
        icon: "star",
        createdAt: new Date().toISOString(),
      }).success).toBe(true);
    });

    test("SubtaskSchema should validate complete subtask", () => {
      expect(SubtaskSchema.safeParse({
        id: 1,
        taskId: 1,
        name: "My Subtask",
        isCompleted: false,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
      }).success).toBe(true);
    });
  });
});