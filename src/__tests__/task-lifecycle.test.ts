/**
 * Task Lifecycle Integration Test
 * Tests complete flow: Create → Update → Complete → Delete task
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";
import { createList, createTask, createLabel, createSubtask } from "@/lib/db/repositories";
import { updateTask, toggleTaskCompletion, deleteTask, getTaskById } from "@/lib/db/repositories";
import { addLabelToTask, getTaskLabels } from "@/lib/db/repositories";
import { getSubtasksByTaskId, areAllSubtasksCompleted } from "@/lib/db/repositories";

describe("Task Lifecycle Integration", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  test("should complete full task lifecycle", () => {
    // Step 1: Create a list for the task
    const list = createList({ name: "Work Tasks", color: "#6366f1" });
    expect(list.id).toBeGreaterThan(0);

    // Step 2: Create a label
    const label = createLabel({ name: "Important", color: "#ef4444" });
    expect(label.id).toBeGreaterThan(0);

    // Step 3: Create a task with labels
    const task = createTask({
      listId: list.id,
      name: "Complete project documentation",
      description: "Write comprehensive docs for the new feature",
      priority: "high",
      taskDate: "2025-12-31",
      labelIds: [label.id],
    });
    expect(task.id).toBeGreaterThan(0);
    expect(task.name).toBe("Complete project documentation");
    expect(task.isCompleted).toBe(false);

    // Verify task has label
    const taskLabels = getTaskLabels(task.id);
    expect(taskLabels.length).toBe(1);
    expect(taskLabels[0].name).toBe("Important");

    // Step 4: Create subtasks
    const subtask1 = createSubtask({ taskId: task.id, name: "Outline sections" });
    const subtask2 = createSubtask({ taskId: task.id, name: "Write API docs" });
    const subtask3 = createSubtask({ taskId: task.id, name: "Add examples" });
    
    expect(subtask1.id).toBeGreaterThan(0);
    expect(subtask2.id).toBeGreaterThan(0);
    expect(subtask3.id).toBeGreaterThan(0);

    // Verify subtasks are linked
    const subtasks = getSubtasksByTaskId(task.id);
    expect(subtasks.length).toBe(3);

    // Step 5: Update task details
    const updatedTask = updateTask(task.id, {
      name: "Complete comprehensive project documentation",
      priority: "medium",
      description: "Write comprehensive docs including API reference",
    });
    
    expect(updatedTask).not.toBeNull();
    expect(updatedTask?.name).toBe("Complete comprehensive project documentation");
    expect(updatedTask?.priority).toBe("medium");

    // Step 6: Complete subtasks one by one
    const { toggleSubtaskCompletion } = require("@/lib/db/repositories");
    
    toggleSubtaskCompletion(subtask1.id);
    expect(areAllSubtasksCompleted(task.id)).toBe(false);

    toggleSubtaskCompletion(subtask2.id);
    expect(areAllSubtasksCompleted(task.id)).toBe(false);

    toggleSubtaskCompletion(subtask3.id);
    expect(areAllSubtasksCompleted(task.id)).toBe(true);

    // Step 7: Complete the main task
    const completedTask = toggleTaskCompletion(task.id);
    expect(completedTask).not.toBeNull();
    expect(completedTask?.isCompleted).toBe(true);
    expect(completedTask?.completedAt).not.toBeNull();

    // Verify task is marked complete
    const verifiedTask = getTaskById(task.id);
    expect(verifiedTask?.isCompleted).toBe(true);

    // Step 8: Uncomplete the task (undo)
    const uncompletedTask = toggleTaskCompletion(task.id);
    expect(uncompletedTask?.isCompleted).toBe(false);

    // Step 9: Complete again and delete
    toggleTaskCompletion(task.id);
    const deleted = deleteTask(task.id);
    expect(deleted).toBe(true);

    // Step 10: Verify task is gone
    const goneTask = getTaskById(task.id);
    expect(goneTask).toBeNull();

    // Verify subtasks are also gone (cascade delete)
    const goneSubtasks = getSubtasksByTaskId(task.id);
    expect(goneSubtasks).toEqual([]);
  });

  test("should handle task with multiple labels", () => {
    const list = createList({ name: "Multi-label List" });
    const label1 = createLabel({ name: "Work" });
    const label2 = createLabel({ name: "Urgent" });
    const label3 = createLabel({ name: "Review" });

    const task = createTask({
      listId: list.id,
      name: "Multi-label task",
      labelIds: [label1.id, label2.id, label3.id],
    });

    const labels = getTaskLabels(task.id);
    expect(labels.length).toBe(3);
    expect(labels.map((l) => l.name).sort()).toEqual(["Review", "Urgent", "Work"]);

    // Add another label
    const label4 = createLabel({ name: "Follow-up" });
    addLabelToTask(task.id, label4.id);

    const updatedLabels = getTaskLabels(task.id);
    expect(updatedLabels.length).toBe(4);
  });

  test("should move task between lists", () => {
    const list1 = createList({ name: "Inbox" });
    const list2 = createList({ name: "Work" });

    const task = createTask({
      listId: list1.id,
      name: "Task to move",
    });

    expect(task.listId).toBe(list1.id);

    // Move to list2
    const { moveTaskToList } = require("@/lib/db/repositories");
    const movedTask = moveTaskToList(task.id, list2.id);

    expect(movedTask).not.toBeNull();
    expect(movedTask?.listId).toBe(list2.id);

    // Verify move persisted
    const verifiedTask = getTaskById(task.id);
    expect(verifiedTask?.listId).toBe(list2.id);
  });
});