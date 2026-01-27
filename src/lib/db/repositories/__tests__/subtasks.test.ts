/**
 * Subtasks Repository Tests
 * Tests CRUD operations, completion, and reordering
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import {
  getSubtasksByTaskId,
  getSubtaskById,
  getSubtaskCount,
  createSubtask,
  createSubtasks,
  updateSubtask,
  toggleSubtaskCompletion,
  deleteSubtask,
  deleteSubtasksByTaskId,
  reorderSubtasks,
  areAllSubtasksCompleted,
} from "../subtasks";
import { createList, createTask } from "../tasks";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";

describe("Subtasks Repository", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  // Helper to create a task with subtasks
  function createTestTask(name: string = "Test Task") {
    const list = createList({ name: "Test List" });
    return createTask({ listId: list.id, name });
  }

  describe("getSubtasksByTaskId", () => {
    test("should return all subtasks for a task ordered by sort_order", () => {
      const task = createTestTask();
      
      createSubtask({ taskId: task.id, name: "Subtask A", sortOrder: 2 });
      createSubtask({ taskId: task.id, name: "Subtask B", sortOrder: 1 });
      createSubtask({ taskId: task.id, name: "Subtask C", sortOrder: 0 });

      const subtasks = getSubtasksByTaskId(task.id);

      expect(subtasks.length).toBe(3);
      expect(subtasks[0].name).toBe("Subtask C"); // sortOrder 0
      expect(subtasks[1].name).toBe("Subtask B"); // sortOrder 1
      expect(subtasks[2].name).toBe("Subtask A"); // sortOrder 2
    });

    test("should return empty array for task without subtasks", () => {
      const task = createTestTask();
      const subtasks = getSubtasksByTaskId(task.id);

      expect(subtasks).toEqual([]);
    });

    test("should return subtasks with correct properties", () => {
      const task = createTestTask();
      createSubtask({ taskId: task.id, name: "Test Subtask" });

      const subtasks = getSubtasksByTaskId(task.id);
      
      expect(subtasks.length).toBe(1);
      const subtask = subtasks[0];
      expect(subtask).toHaveProperty("id");
      expect(subtask).toHaveProperty("taskId");
      expect(subtask).toHaveProperty("name");
      expect(subtask).toHaveProperty("isCompleted");
      expect(subtask).toHaveProperty("sortOrder");
      expect(subtask).toHaveProperty("createdAt");
    });
  });

  describe("getSubtaskById", () => {
    test("should return subtask by ID", () => {
      const task = createTestTask();
      const created = createSubtask({ taskId: task.id, name: "Test Subtask" });

      const found = getSubtaskById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe("Test Subtask");
      expect(found?.taskId).toBe(task.id);
    });

    test("should return null for non-existent subtask", () => {
      const found = getSubtaskById(99999);
      expect(found).toBeNull();
    });
  });

  describe("getSubtaskCount", () => {
    test("should return correct total and completed counts", () => {
      const task = createTestTask();
      
      const subtask1 = createSubtask({ taskId: task.id, name: "Completed" });
      const subtask2 = createSubtask({ taskId: task.id, name: "Pending" });
      createSubtask({ taskId: task.id, name: "Also Pending" });

      // Complete one subtask
      toggleSubtaskCompletion(subtask1.id);

      const counts = getSubtaskCount(task.id);

      expect(counts.total).toBe(3);
      expect(counts.completed).toBe(1);
    });

    test("should return zero counts for task without subtasks", () => {
      const task = createTestTask();
      const counts = getSubtaskCount(task.id);

      expect(counts.total).toBe(0);
      expect(counts.completed).toBe(0);
    });
  });

  describe("createSubtask", () => {
    test("should create subtask with auto-increment sort order", () => {
      const task = createTestTask();
      
      const subtask1 = createSubtask({ taskId: task.id, name: "First" });
      const subtask2 = createSubtask({ taskId: task.id, name: "Second" });
      const subtask3 = createSubtask({ taskId: task.id, name: "Third" });

      expect(subtask1.sortOrder).toBe(0);
      expect(subtask2.sortOrder).toBe(1);
      expect(subtask3.sortOrder).toBe(2);
    });

    test("should create subtask with custom sort order", () => {
      const task = createTestTask();
      
      const subtask = createSubtask({
        taskId: task.id,
        name: "Custom Order",
        sortOrder: 10,
      });

      expect(subtask.sortOrder).toBe(10);
    });

    test("should create subtask as incomplete by default", () => {
      const task = createTestTask();
      const subtask = createSubtask({ taskId: task.id, name: "New Subtask" });

      expect(subtask.isCompleted).toBe(false);
    });

    test("should throw error when creating subtask for non-existent task", () => {
      expect(() => {
        createSubtask({ taskId: 99999, name: "Orphan Subtask" });
      }).toThrow();
    });

    test("should log activity when creating subtask", () => {
      const task = createTestTask();
      createSubtask({ taskId: task.id, name: "Activity Test" });

      // Verify activity log was created
      const { query } = require("@/lib/db");
      const activities = query(
        "SELECT * FROM activity_logs WHERE task_id = ? AND action = ?",
        [task.id, "subtask_added"]
      );
      
      expect(activities.length).toBeGreaterThan(0);
    });
  });

  describe("createSubtasks", () => {
    test("should create multiple subtasks at once", () => {
      const task = createTestTask();
      
      const subtasks = createSubtasks(task.id, ["Subtask 1", "Subtask 2", "Subtask 3"]);

      expect(subtasks.length).toBe(3);
      expect(subtasks[0].name).toBe("Subtask 1");
      expect(subtasks[1].name).toBe("Subtask 2");
      expect(subtasks[2].name).toBe("Subtask 3");
    });

    test("should assign sequential sort orders", () => {
      const task = createTestTask();
      
      const subtasks = createSubtasks(task.id, ["A", "B", "C"]);

      expect(subtasks[0].sortOrder).toBe(0);
      expect(subtasks[1].sortOrder).toBe(1);
      expect(subtasks[2].sortOrder).toBe(2);
    });

    test("should continue sort order from existing subtasks", () => {
      const task = createTestTask();
      
      // Create existing subtask
      createSubtask({ taskId: task.id, name: "Existing" });
      
      // Create batch
      const subtasks = createSubtasks(task.id, ["New 1", "New 2"]);

      expect(subtasks[0].sortOrder).toBe(1);
      expect(subtasks[1].sortOrder).toBe(2);
    });

    test("should log activity for each subtask", () => {
      const task = createTestTask();
      createSubtasks(task.id, ["A", "B"]);

      const { query } = require("@/lib/db");
      const activities = query(
        "SELECT * FROM activity_logs WHERE task_id = ? AND action = ?",
        [task.id, "subtask_added"]
      );
      
      expect(activities.length).toBe(2);
    });
  });

  describe("updateSubtask", () => {
    test("should update subtask name", () => {
      const task = createTestTask();
      const created = createSubtask({ taskId: task.id, name: "Original" });

      const updated = updateSubtask(created.id, { name: "Updated" });

      expect(updated?.name).toBe("Updated");
    });

    test("should update subtask completion status", () => {
      const task = createTestTask();
      const created = createSubtask({ taskId: task.id, name: "Test" });

      const updated = updateSubtask(created.id, { isCompleted: true });

      expect(updated?.isCompleted).toBe(true);
    });

    test("should update subtask sort order", () => {
      const task = createTestTask();
      const created = createSubtask({ taskId: task.id, name: "Test", sortOrder: 0 });

      const updated = updateSubtask(created.id, { sortOrder: 5 });

      expect(updated?.sortOrder).toBe(5);
    });

    test("should update multiple fields", () => {
      const task = createTestTask();
      const created = createSubtask({ taskId: task.id, name: "Test" });

      const updated = updateSubtask(created.id, {
        name: "New Name",
        isCompleted: true,
        sortOrder: 3,
      });

      expect(updated?.name).toBe("New Name");
      expect(updated?.isCompleted).toBe(true);
      expect(updated?.sortOrder).toBe(3);
    });

    test("should return null for non-existent subtask", () => {
      const updated = updateSubtask(99999, { name: "New Name" });
      expect(updated).toBeNull();
    });

    test("should return unchanged when no updates provided", () => {
      const task = createTestTask();
      const created = createSubtask({ taskId: task.id, name: "Test" });

      const updated = updateSubtask(created.id, {});

      expect(updated?.name).toBe("Test");
      expect(updated?.id).toBe(created.id);
    });
  });

  describe("toggleSubtaskCompletion", () => {
    test("should toggle from incomplete to complete", () => {
      const task = createTestTask();
      const subtask = createSubtask({ taskId: task.id, name: "Test" });
      expect(subtask.isCompleted).toBe(false);

      const toggled = toggleSubtaskCompletion(subtask.id);

      expect(toggled?.isCompleted).toBe(true);
    });

    test("should toggle from complete to incomplete", () => {
      const task = createTestTask();
      const subtask = createSubtask({ taskId: task.id, name: "Test" });
      toggleSubtaskCompletion(subtask.id); // Complete it

      const toggled = toggleSubtaskCompletion(subtask.id); // Toggle back

      expect(toggled?.isCompleted).toBe(false);
    });

    test("should return null for non-existent subtask", () => {
      const toggled = toggleSubtaskCompletion(99999);
      expect(toggled).toBeNull();
    });
  });

  describe("deleteSubtask", () => {
    test("should delete a subtask", () => {
      const task = createTestTask();
      const subtask = createSubtask({ taskId: task.id, name: "To Delete" });

      const deleted = deleteSubtask(subtask.id);

      expect(deleted).toBe(true);
      expect(getSubtaskById(subtask.id)).toBeNull();
    });

    test("should return false for non-existent subtask", () => {
      const deleted = deleteSubtask(99999);
      expect(deleted).toBe(false);
    });
  });

  describe("deleteSubtasksByTaskId", () => {
    test("should delete all subtasks for a task", () => {
      const task = createTestTask();
      createSubtask({ taskId: task.id, name: "Subtask 1" });
      createSubtask({ taskId: task.id, name: "Subtask 2" });
      createSubtask({ taskId: task.id, name: "Subtask 3" });

      const deletedCount = deleteSubtasksByTaskId(task.id);

      expect(deletedCount).toBe(3);
      expect(getSubtasksByTaskId(task.id)).toEqual([]);
    });

    test("should return 0 for task without subtasks", () => {
      const task = createTestTask();
      const deletedCount = deleteSubtasksByTaskId(task.id);

      expect(deletedCount).toBe(0);
    });
  });

  describe("reorderSubtasks", () => {
    test("should reorder subtasks by ID array", () => {
      const task = createTestTask();
      const subtaskA = createSubtask({ taskId: task.id, name: "A" });
      const subtaskB = createSubtask({ taskId: task.id, name: "B" });
      const subtaskC = createSubtask({ taskId: task.id, name: "C" });

      // Reorder: C, A, B
      reorderSubtasks(task.id, [subtaskC.id, subtaskA.id, subtaskB.id]);

      const subtasks = getSubtasksByTaskId(task.id);
      
      expect(subtasks[0].id).toBe(subtaskC.id);
      expect(subtasks[0].sortOrder).toBe(0);
      expect(subtasks[1].id).toBe(subtaskA.id);
      expect(subtasks[1].sortOrder).toBe(1);
      expect(subtasks[2].id).toBe(subtaskB.id);
      expect(subtasks[2].sortOrder).toBe(2);
    });

    test("should only affect subtasks in the specified task", () => {
      const task1 = createTestTask("Task 1");
      const task2 = createTestTask("Task 2");
      
      const subtask1 = createSubtask({ taskId: task1.id, name: "Task1 Sub" });
      const subtask2 = createSubtask({ taskId: task2.id, name: "Task2 Sub" });

      // Try to reorder task2's subtask through task1
      reorderSubtasks(task1.id, [subtask2.id, subtask1.id]);

      // Task1's subtask should be unaffected (subtask2 doesn't belong to task1)
      const subtasks = getSubtasksByTaskId(task1.id);
      expect(subtasks.length).toBe(1);
      expect(subtasks[0].id).toBe(subtask1.id);
    });
  });

  describe("areAllSubtasksCompleted", () => {
    test("should return true when all subtasks are completed", () => {
      const task = createTestTask();
      const subtask1 = createSubtask({ taskId: task.id, name: "Subtask 1" });
      const subtask2 = createSubtask({ taskId: task.id, name: "Subtask 2" });

      toggleSubtaskCompletion(subtask1.id);
      toggleSubtaskCompletion(subtask2.id);

      expect(areAllSubtasksCompleted(task.id)).toBe(true);
    });

    test("should return false when some subtasks are incomplete", () => {
      const task = createTestTask();
      const subtask1 = createSubtask({ taskId: task.id, name: "Subtask 1" });
      createSubtask({ taskId: task.id, name: "Subtask 2" });

      toggleSubtaskCompletion(subtask1.id);

      expect(areAllSubtasksCompleted(task.id)).toBe(false);
    });

    test("should return false when task has no subtasks", () => {
      const task = createTestTask();
      expect(areAllSubtasksCompleted(task.id)).toBe(false);
    });

    test("should return true after completing all subtasks one by one", () => {
      const task = createTestTask();
      const subtask1 = createSubtask({ taskId: task.id, name: "Subtask 1" });
      const subtask2 = createSubtask({ taskId: task.id, name: "Subtask 2" });
      const subtask3 = createSubtask({ taskId: task.id, name: "Subtask 3" });

      expect(areAllSubtasksCompleted(task.id)).toBe(false);

      toggleSubtaskCompletion(subtask1.id);
      expect(areAllSubtasksCompleted(task.id)).toBe(false);

      toggleSubtaskCompletion(subtask2.id);
      expect(areAllSubtasksCompleted(task.id)).toBe(false);

      toggleSubtaskCompletion(subtask3.id);
      expect(areAllSubtasksCompleted(task.id)).toBe(true);
    });
  });
});