/**
 * Tasks Repository Tests
 * Tests CRUD operations, filtering by view, and labels management
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import {
  getTaskById,
  getTaskSummaryById,
  getTasks,
  getTaskSummaries,
  getTasksByListId,
  getTodaysTasks,
  getUpcomingTasks,
  getOverdueTasks,
  getCompletedTasks,
  getTaskLabels,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
  moveTaskToList,
  getTasksByView,
} from "../tasks";
import { createList } from "../lists";
import { createLabel, addLabelToTask } from "../labels";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";
import { format, addDays, subDays } from "date-fns";

describe("Tasks Repository", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  // Helper to create a list for tests
  function createTestList(name: string = "Test List") {
    return createList({ name });
  }

  describe("getTaskById", () => {
    test("should return task by ID", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Test Task" });

      const found = getTaskById(task.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(task.id);
      expect(found?.name).toBe("Test Task");
      expect(found?.listId).toBe(list.id);
    });

    test("should return null for non-existent task", () => {
      const found = getTaskById(99999);
      expect(found).toBeNull();
    });

    test("should return task with all properties", () => {
      const list = createTestList();
      const today = format(new Date(), "yyyy-MM-dd");
      
      const task = createTask({
        listId: list.id,
        name: "Full Task",
        description: "Description here",
        taskDate: today,
        priority: "high",
      });

      const found = getTaskById(task.id);

      expect(found?.name).toBe("Full Task");
      expect(found?.description).toBe("Description here");
      expect(found?.taskDate).toBe(today);
      expect(found?.priority).toBe("high");
      expect(found?.isCompleted).toBe(false);
    });
  });

  describe("getTaskSummaryById", () => {
    test("should return task summary with list info", () => {
      const list = createTestList("My List");
      const task = createTask({ listId: list.id, name: "Task Name" });

      const summary = getTaskSummaryById(task.id);

      expect(summary).not.toBeNull();
      expect(summary?.id).toBe(task.id);
      expect(summary?.name).toBe("Task Name");
      expect(summary?.listId).toBe(list.id);
      expect(summary?.listName).toBe("My List");
    });
  });

  describe("createTask", () => {
    test("should create task with minimum fields", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Simple Task" });

      expect(task.name).toBe("Simple Task");
      expect(task.listId).toBe(list.id);
      expect(task.priority).toBe("none");
      expect(task.isCompleted).toBe(false);
      expect(task.id).toBeGreaterThan(0);
    });

    test("should create task with all fields", () => {
      const list = createTestList();
      const today = format(new Date(), "yyyy-MM-dd");
      
      const task = createTask({
        listId: list.id,
        name: "Complex Task",
        description: "A detailed description",
        taskDate: today,
        deadline: new Date().toISOString(),
        reminder: new Date().toISOString(),
        estimate: "02:30",
        priority: "high",
        recurrenceRule: { frequency: "daily", interval: 1 },
      });

      expect(task.name).toBe("Complex Task");
      expect(task.description).toBe("A detailed description");
      expect(task.taskDate).toBe(today);
      expect(task.estimate).toBe("02:30");
      expect(task.priority).toBe("high");
      expect(task.recurrenceRule).toEqual({ frequency: "daily", interval: 1 });
    });

    test("should create task with labels", () => {
      const list = createTestList();
      const label1 = createLabel({ name: "Label 1" });
      const label2 = createLabel({ name: "Label 2" });

      const task = createTask({
        listId: list.id,
        name: "Task with Labels",
        labelIds: [label1.id, label2.id],
      });

      const labels = getTaskLabels(task.id);
      expect(labels.length).toBe(2);
      expect(labels.map((l) => l.name)).toContain("Label 1");
      expect(labels.map((l) => l.name)).toContain("Label 2");
    });

    test("should throw error when creating task with non-existent list", () => {
      expect(() => {
        createTask({ listId: 99999, name: "Invalid Task" });
      }).toThrow();
    });
  });

  describe("getTasks", () => {
    test("should return all tasks when no filter", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Task 1" });
      createTask({ listId: list.id, name: "Task 2" });

      const tasks = getTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });

    test("should filter by listId", () => {
      const list1 = createList({ name: "List 1" });
      const list2 = createList({ name: "List 2" });

      createTask({ listId: list1.id, name: "Task in List 1" });
      createTask({ listId: list2.id, name: "Task in List 2" });

      const tasksInList1 = getTasks({ listId: list1.id });
      expect(tasksInList1.every((t) => t.listId === list1.id)).toBe(true);
      expect(tasksInList1.some((t) => t.name === "Task in List 1")).toBe(true);
    });

    test("should filter by priority", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "High Priority", priority: "high" });
      createTask({ listId: list.id, name: "Low Priority", priority: "low" });

      const highPriorityTasks = getTasks({ priority: "high" });
      expect(highPriorityTasks.every((t) => t.priority === "high")).toBe(true);
    });

    test("should filter by completion status", () => {
      const list = createTestList();
      const activeTask = createTask({ listId: list.id, name: "Active" });
      const completedTask = createTask({ listId: list.id, name: "Completed" });
      
      toggleTaskCompletion(completedTask.id);

      const activeTasks = getTasks({ isCompleted: false });
      const completedTasks = getTasks({ isCompleted: true });

      expect(activeTasks.some((t) => t.id === activeTask.id)).toBe(true);
      expect(completedTasks.some((t) => t.id === completedTask.id)).toBe(true);
    });

    test("should filter by task date", () => {
      const list = createTestList();
      const today = format(new Date(), "yyyy-MM-dd");
      
      createTask({ listId: list.id, name: "Today Task", taskDate: today });
      createTask({ listId: list.id, name: "Tomorrow Task", taskDate: format(addDays(new Date(), 1), "yyyy-MM-dd") });

      const todayTasks = getTasks({ taskDate: today });
      expect(todayTasks.every((t) => t.taskDate === today)).toBe(true);
    });

    test("should filter by date range", () => {
      const list = createTestList();
      const today = format(new Date(), "yyyy-MM-dd");
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
      const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

      createTask({ listId: list.id, name: "Tomorrow Task", taskDate: tomorrow });
      createTask({ listId: list.id, name: "Next Week Task", taskDate: nextWeek });

      const rangeTasks = getTasks({
        dateRange: { start: today, end: tomorrow },
      });

      expect(rangeTasks.some((t) => t.name === "Tomorrow Task")).toBe(true);
      expect(rangeTasks.some((t) => t.name === "Next Week Task")).toBe(false);
    });

    test("should filter by label IDs", () => {
      const list = createTestList();
      const label = createLabel({ name: "Important" });
      
      createTask({ listId: list.id, name: "Labeled Task", labelIds: [label.id] });
      createTask({ listId: list.id, name: "Unlabeled Task" });

      const labeledTasks = getTasks({ labelIds: [label.id] });
      expect(labeledTasks.some((t) => t.name === "Labeled Task")).toBe(true);
    });
  });

  describe("updateTask", () => {
    test("should update task name", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Original Name" });

      const updated = updateTask(task.id, { name: "Updated Name" });

      expect(updated?.name).toBe("Updated Name");
    });

    test("should update task description", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Task" });

      const updated = updateTask(task.id, { description: "New description" });

      expect(updated?.description).toBe("New description");
    });

    test("should update task priority", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Task", priority: "low" });

      const updated = updateTask(task.id, { priority: "high" });

      expect(updated?.priority).toBe("high");
    });

    test("should update task date", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Task" });
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

      const updated = updateTask(task.id, { taskDate: tomorrow });

      expect(updated?.taskDate).toBe(tomorrow);
    });

    test("should update task labels", () => {
      const list = createTestList();
      const label1 = createLabel({ name: "Label 1" });
      const label2 = createLabel({ name: "Label 2" });
      
      const task = createTask({
        listId: list.id,
        name: "Task",
        labelIds: [label1.id],
      });

      // Update labels
      const updated = updateTask(task.id, { labelIds: [label2.id] });
      const labels = getTaskLabels(task.id);

      expect(labels.length).toBe(1);
      expect(labels[0].name).toBe("Label 2");
    });

    test("should complete and uncomplete task", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Task" });

      // Complete
      const completed = updateTask(task.id, { isCompleted: true });
      expect(completed?.isCompleted).toBe(true);
      expect(completed?.completedAt).not.toBeNull();

      // Uncomplete
      const uncompleted = updateTask(task.id, { isCompleted: false });
      expect(uncompleted?.isCompleted).toBe(false);
      expect(uncompleted?.completedAt).toBeNull();
    });

    test("should return null for non-existent task", () => {
      const updated = updateTask(99999, { name: "New Name" });
      expect(updated).toBeNull();
    });

    test("should update multiple fields", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Task" });

      const updated = updateTask(task.id, {
        name: "New Name",
        priority: "medium",
        description: "Desc",
      });

      expect(updated?.name).toBe("New Name");
      expect(updated?.priority).toBe("medium");
      expect(updated?.description).toBe("Desc");
    });
  });

  describe("toggleTaskCompletion", () => {
    test("should toggle task from incomplete to complete", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Task" });
      expect(task.isCompleted).toBe(false);

      const toggled = toggleTaskCompletion(task.id);
      expect(toggled?.isCompleted).toBe(true);
    });

    test("should toggle task from complete to incomplete", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Task", isCompleted: true });

      const toggled = toggleTaskCompletion(task.id);
      expect(toggled?.isCompleted).toBe(false);
    });

    test("should return null for non-existent task", () => {
      const toggled = toggleTaskCompletion(99999);
      expect(toggled).toBeNull();
    });
  });

  describe("deleteTask", () => {
    test("should delete a task", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "To Delete" });

      const deleted = deleteTask(task.id);

      expect(deleted).toBe(true);
      expect(getTaskById(task.id)).toBeNull();
    });

    test("should return false for non-existent task", () => {
      const deleted = deleteTask(99999);
      expect(deleted).toBe(false);
    });
  });

  describe("moveTaskToList", () => {
    test("should move task to different list", () => {
      const list1 = createList({ name: "List 1" });
      const list2 = createList({ name: "List 2" });
      const task = createTask({ listId: list1.id, name: "Task to Move" });

      const moved = moveTaskToList(task.id, list2.id);

      expect(moved?.listId).toBe(list2.id);
      expect(getTaskById(task.id)?.listId).toBe(list2.id);
    });
  });

  describe("getTasksByView", () => {
    test("should get today's tasks", () => {
      const list = createTestList();
      const today = format(new Date(), "yyyy-MM-dd");
      
      createTask({ listId: list.id, name: "Today Task", taskDate: today });
      createTask({ listId: list.id, name: "Tomorrow Task", taskDate: format(addDays(new Date(), 1), "yyyy-MM-dd") });

      const todaysTasks = getTasksByView("today");
      expect(todaysTasks.some((t) => t.name === "Today Task")).toBe(true);
    });

    test("should get upcoming tasks", () => {
      const list = createTestList();
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      
      createTask({ listId: list.id, name: "Tomorrow Task", taskDate: tomorrow });
      createTask({ listId: list.id, name: "Yesterday Task", taskDate: yesterday });

      const upcomingTasks = getTasksByView("upcoming");
      expect(upcomingTasks.some((t) => t.name === "Tomorrow Task")).toBe(true);
    });

    test("should get completed tasks", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Completed Task" });
      toggleTaskCompletion(task.id);

      const completedTasks = getTasksByView("completed");
      expect(completedTasks.some((t) => t.id === task.id)).toBe(true);
    });

    test("should get all tasks", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Task 1" });
      createTask({ listId: list.id, name: "Task 2" });

      const allTasks = getTasksByView("all");
      expect(allTasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getTaskLabels", () => {
    test("should return labels for a task", () => {
      const list = createTestList();
      const label = createLabel({ name: "Test Label" });
      const task = createTask({
        listId: list.id,
        name: "Labeled Task",
        labelIds: [label.id],
      });

      const labels = getTaskLabels(task.id);

      expect(labels.length).toBe(1);
      expect(labels[0].name).toBe("Test Label");
    });

    test("should return empty array for task without labels", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "Unlabeled Task" });

      const labels = getTaskLabels(task.id);

      expect(labels).toEqual([]);
    });
  });
});