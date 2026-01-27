/**
 * Search Repository Tests
 * Tests fuzzy search functionality
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import {
  searchTasks,
  quickSearchTasks,
  searchLabels,
  globalSearch,
  searchInList,
  getSearchSuggestions,
  advancedSearch,
} from "../search";
import { createList, createTask, createLabel } from "../tasks";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";

describe("Search Repository", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  // Helper to create test data
  function createTestList(name: string = "Test List") {
    return createList({ name });
  }

  describe("searchTasks", () => {
    test("should find tasks by exact name match", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Buy groceries" });
      createTask({ listId: list.id, name: "Walk the dog" });

      const results = searchTasks("groceries");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.item.name === "Buy groceries")).toBe(true);
    });

    test("should find tasks by partial match", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Complete project documentation" });

      const results = searchTasks("doc");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.item.name.includes("documentation"))).toBe(true);
    });

    test("should return fuzzy matches", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Meeting with team" });

      const results = searchTasks("meting"); // Typo

      expect(results.length).toBeGreaterThan(0);
    });

    test("should filter by listId", () => {
      const list1 = createList({ name: "Work" });
      const list2 = createList({ name: "Personal" });
      
      createTask({ listId: list1.id, name: "Work task" });
      createTask({ listId: list2.id, name: "Personal task" });

      const results = searchTasks("task", { listId: list1.id });

      expect(results.every((r) => r.item.listId === list1.id)).toBe(true);
    });

    test("should filter by completion status", () => {
      const list = createTestList();
      const activeTask = createTask({ listId: list.id, name: "Active task" });
      const completedTask = createTask({ listId: list.id, name: "Completed task" });
      
      // Complete one task
      const { toggleTaskCompletion } = require("../tasks");
      toggleTaskCompletion(completedTask.id);

      const activeResults = searchTasks("task", { isCompleted: false });
      const completedResults = searchTasks("task", { isCompleted: true });

      expect(activeResults.some((r) => r.item.id === activeTask.id)).toBe(true);
      expect(completedResults.some((r) => r.item.id === completedTask.id)).toBe(true);
    });

    test("should respect limit parameter", () => {
      const list = createTestList();
      
      // Create many tasks
      for (let i = 0; i < 10; i++) {
        createTask({ listId: list.id, name: `Task ${i}` });
      }

      const results = searchTasks("Task", { limit: 5 });

      expect(results.length).toBeLessThanOrEqual(5);
    });

    test("should return results with scores", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Exact Match" });

      const results = searchTasks("Exact Match");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("score");
      expect(typeof results[0].score).toBe("number");
    });

    test("should return empty array for no matches", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Task" });

      const results = searchTasks("xyz123nonexistent");

      expect(results).toEqual([]);
    });
  });

  describe("quickSearchTasks", () => {
    test("should find tasks using SQL LIKE", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Quick search test" });

      const results = quickSearchTasks("search");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name === "Quick search test")).toBe(true);
    });

    test("should search in task name", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Specific name" });

      const results = quickSearchTasks("Specific");

      expect(results.some((r) => r.name === "Specific name")).toBe(true);
    });

    test("should respect limit parameter", () => {
      const list = createTestList();
      
      for (let i = 0; i < 15; i++) {
        createTask({ listId: list.id, name: `Quick task ${i}` });
      }

      const results = quickSearchTasks("Quick", 5);

      expect(results.length).toBeLessThanOrEqual(5);
    });

    test("should order results by relevance", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Exact match" });
      createTask({ listId: list.id, name: "Something else" });

      const results = quickSearchTasks("Exact match");

      // Exact match should be first
      expect(results[0]?.name).toBe("Exact match");
    });
  });

  describe("searchLabels", () => {
    test("should find labels by name", () => {
      createLabel({ name: "Important" });
      createLabel({ name: "Urgent" });

      const results = searchLabels("Important");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.item.name === "Important")).toBe(true);
    });

    test("should find labels case-insensitively", () => {
      createLabel({ name: "Work" });

      const results = searchLabels("work");

      expect(results.some((r) => r.item.name === "Work")).toBe(true);
    });

    test("should return fuzzy matches for labels", () => {
      createLabel({ name: "Project" });

      const results = searchLabels("projct"); // Typo

      expect(results.length).toBeGreaterThan(0);
    });

    test("should respect limit parameter", () => {
      for (let i = 0; i < 10; i++) {
        createLabel({ name: `Label ${i}` });
      }

      const results = searchLabels("Label", 5);

      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe("globalSearch", () => {
    test("should search both tasks and labels", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Searchable task" });
      createLabel({ name: "Searchable label" });

      const results = globalSearch("Searchable");

      expect(results.tasks.length).toBeGreaterThan(0);
      expect(results.labels.length).toBeGreaterThan(0);
    });

    test("should return structured results", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Test" });

      const results = globalSearch("Test");

      expect(results).toHaveProperty("tasks");
      expect(results).toHaveProperty("labels");
      expect(Array.isArray(results.tasks)).toBe(true);
      expect(Array.isArray(results.labels)).toBe(true);
    });

    test("should respect limit for both types", () => {
      const list = createTestList();
      
      for (let i = 0; i < 10; i++) {
        createTask({ listId: list.id, name: `Task ${i}` });
        createLabel({ name: `Label ${i}` });
      }

      const results = globalSearch("Task", 5);

      expect(results.tasks.length).toBeLessThanOrEqual(5);
    });
  });

  describe("searchInList", () => {
    test("should search only within specified list", () => {
      const workList = createList({ name: "Work" });
      const personalList = createList({ name: "Personal" });
      
      createTask({ listId: workList.id, name: "Work meeting" });
      createTask({ listId: personalList.id, name: "Personal meeting" });

      const results = searchInList(workList.id, "meeting");

      expect(results.every((r) => r.item.listId === workList.id)).toBe(true);
      expect(results.some((r) => r.item.name === "Work meeting")).toBe(true);
      expect(results.some((r) => r.item.name === "Personal meeting")).toBe(false);
    });

    test("should return empty array for non-existent list", () => {
      const results = searchInList(99999, "task");
      expect(results).toEqual([]);
    });
  });

  describe("getSearchSuggestions", () => {
    test("should suggest task names", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Buy apples" });
      createTask({ listId: list.id, name: "Buy bananas" });

      const suggestions = getSearchSuggestions("Buy");

      expect(suggestions.includes("Buy apples")).toBe(true);
      expect(suggestions.includes("Buy bananas")).toBe(true);
    });

    test("should suggest label names", () => {
      createLabel({ name: "High Priority" });
      createLabel({ name: "High Value" });

      const suggestions = getSearchSuggestions("High");

      expect(suggestions.includes("High Priority")).toBe(true);
      expect(suggestions.includes("High Value")).toBe(true);
    });

    test("should combine task and label suggestions", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Work task" });
      createLabel({ name: "Work label" });

      const suggestions = getSearchSuggestions("Work");

      expect(suggestions.includes("Work task")).toBe(true);
      expect(suggestions.includes("Work label")).toBe(true);
    });

    test("should deduplicate suggestions", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "Duplicate" });
      createLabel({ name: "Duplicate" });

      const suggestions = getSearchSuggestions("Duplicate");

      const duplicates = suggestions.filter((s) => s === "Duplicate");
      expect(duplicates.length).toBe(1);
    });

    test("should respect limit parameter", () => {
      const list = createTestList();
      
      for (let i = 0; i < 15; i++) {
        createTask({ listId: list.id, name: `Suggestion ${i}` });
      }

      const suggestions = getSearchSuggestions("Suggestion", 5);

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    test("should be case-insensitive", () => {
      const list = createTestList();
      createTask({ listId: list.id, name: "UPPERCASE" });

      const suggestions = getSearchSuggestions("upper");

      expect(suggestions.includes("UPPERCASE")).toBe(true);
    });
  });

  describe("advancedSearch", () => {
    beforeEach(() => {
      // Set up comprehensive test data
      const workList = createList({ name: "Work" });
      const personalList = createList({ name: "Personal" });
      const urgentLabel = createLabel({ name: "Urgent" });
      
      // Tasks with various properties
      createTask({
        listId: workList.id,
        name: "High priority work task",
        priority: "high",
        taskDate: "2025-12-31",
        labelIds: [urgentLabel.id],
      });
      
      createTask({
        listId: personalList.id,
        name: "Low priority personal task",
        priority: "low",
        taskDate: "2025-12-25",
      });
      
      createTask({
        listId: workList.id,
        name: "Completed work task",
        priority: "medium",
        isCompleted: true,
      });
    });

    test("should filter by query string", () => {
      const results = advancedSearch({ query: "work" });

      expect(results.every((r) => r.name.toLowerCase().includes("work"))).toBe(true);
    });

    test("should filter by listId", () => {
      const workList = createList({ name: "New Work" });
      createTask({ listId: workList.id, name: "New work task" });

      const results = advancedSearch({ listId: workList.id });

      expect(results.every((r) => r.listId === workList.id)).toBe(true);
    });

    test("should filter by priority", () => {
      const results = advancedSearch({ priority: "high" });

      expect(results.every((r) => r.priority === "high")).toBe(true);
    });

    test("should filter by completion status", () => {
      const activeResults = advancedSearch({ isCompleted: false });
      const completedResults = advancedSearch({ isCompleted: true });

      expect(activeResults.every((r) => !r.isCompleted)).toBe(true);
      expect(completedResults.every((r) => r.isCompleted)).toBe(true);
    });

    test("should filter by hasDueDate", () => {
      const withDateResults = advancedSearch({ hasDueDate: true });
      const withoutDateResults = advancedSearch({ hasDueDate: false });

      expect(withDateResults.every((r) => r.taskDate !== null)).toBe(true);
      expect(withoutDateResults.every((r) => r.taskDate === null)).toBe(true);
    });

    test("should filter by date range", () => {
      const results = advancedSearch({
        dateFrom: "2025-12-20",
        dateTo: "2025-12-30",
      });

      expect(results.every((r) => {
        if (!r.taskDate) return false;
        return r.taskDate >= "2025-12-20" && r.taskDate <= "2025-12-30";
      })).toBe(true);
    });

    test("should filter by labelIds", () => {
      const label = createLabel({ name: "Filter Label" });
      const list = createList({ name: "Test" });
      createTask({
        listId: list.id,
        name: "Labeled task",
        labelIds: [label.id],
      });

      const results = advancedSearch({ labelIds: [label.id] });

      // All returned tasks should have the label
      expect(results.length).toBeGreaterThan(0);
    });

    test("should combine multiple filters", () => {
      const list = createList({ name: "Combined Test" });
      createTask({
        listId: list.id,
        name: "Combined filter task",
        priority: "high",
        taskDate: "2025-12-15",
      });

      const results = advancedSearch({
        listId: list.id,
        priority: "high",
        hasDueDate: true,
      });

      expect(results.every((r) => 
        r.listId === list.id && 
        r.priority === "high" && 
        r.taskDate !== null
      )).toBe(true);
    });

    test("should respect limit parameter", () => {
      const list = createList({ name: "Limit Test" });
      
      for (let i = 0; i < 20; i++) {
        createTask({ listId: list.id, name: `Task ${i}` });
      }

      const results = advancedSearch({ limit: 10 });

      expect(results.length).toBeLessThanOrEqual(10);
    });

    test("should return empty array for no matches", () => {
      const results = advancedSearch({ query: "xyznonexistent123" });
      expect(results).toEqual([]);
    });
  });
});