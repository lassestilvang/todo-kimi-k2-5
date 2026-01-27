/**
 * Search Flow Integration Test
 * Tests complete flow: Search → Select → View task
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";
import {
  createList,
  createTask,
  createLabel,
  searchTasks,
  quickSearchTasks,
  globalSearch,
  getSearchSuggestions,
  advancedSearch,
  getTaskById,
  getTaskLabels,
} from "@/lib/db/repositories";

describe("Search Flow Integration", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  test("should complete full search flow", () => {
    // Step 1: Set up test data
    const workList = createList({ name: "Work Projects" });
    const personalList = createList({ name: "Personal" });

    const urgentLabel = createLabel({ name: "Urgent" });
    const reviewLabel = createLabel({ name: "Review" });

    // Create various tasks
    const task1 = createTask({
      listId: workList.id,
      name: "Complete quarterly report",
      description: "Prepare the Q4 financial report",
      priority: "high",
      taskDate: "2025-12-31",
      labelIds: [urgentLabel.id],
    });

    const task2 = createTask({
      listId: workList.id,
      name: "Review code changes",
      description: "Check pull requests from the team",
      priority: "medium",
      taskDate: "2025-12-25",
      labelIds: [reviewLabel.id],
    });

    const task3 = createTask({
      listId: personalList.id,
      name: "Buy groceries",
      description: "Get milk, eggs, and bread",
      priority: "low",
    });

    const task4 = createTask({
      listId: workList.id,
      name: "Report bugs to QA",
      description: "Document issues found in testing",
      priority: "high",
    });

    // Step 2: Search for tasks containing "report"
    const searchResults = searchTasks("report");
    expect(searchResults.length).toBeGreaterThan(0);

    // Should find both "quarterly report" and "Report bugs"
    const foundTaskIds = searchResults.map((r) => r.item.id);
    expect(foundTaskIds).toContain(task1.id);
    expect(foundTaskIds).toContain(task4.id);

    // Step 3: Quick search
    const quickResults = quickSearchTasks("review");
    expect(quickResults.some((t) => t.id === task2.id)).toBe(true);

    // Step 4: Global search (tasks and labels)
    const globalResults = globalSearch("urgent");
    expect(globalResults.tasks.length).toBeGreaterThan(0);
    expect(globalResults.labels.some((l) => l.item.name === "Urgent")).toBe(true);

    // Step 5: Get search suggestions
    const suggestions = getSearchSuggestions("re");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.includes("report"))).toBe(true);

    // Step 6: Select a task and view full details
    const selectedTaskId = searchResults[0].item.id;
    const fullTask = getTaskById(selectedTaskId);
    expect(fullTask).not.toBeNull();

    // Step 7: View task labels
    const labels = getTaskLabels(selectedTaskId);
    expect(Array.isArray(labels)).toBe(true);

    // Step 8: Advanced search with filters
    const advancedResults = advancedSearch({
      query: "report",
      listId: workList.id,
      priority: "high",
    });

    expect(advancedResults.some((t) => t.id === task1.id)).toBe(true);
    expect(advancedResults.some((t) => t.id === task3.id)).toBe(false); // Not in work list
  });

  test("should handle fuzzy search with typos", () => {
    const list = createList({ name: "Test List" });
    
    createTask({
      listId: list.id,
      name: "Meeting with team",
    });

    createTask({
      listId: list.id,
      name: "Prepare presentation",
    });

    // Search with typo
    const results = searchTasks("meting"); // Typo of "meeting"
    expect(results.length).toBeGreaterThan(0);

    // Search with partial match
    const partialResults = searchTasks("pres");
    expect(partialResults.some((r) => r.item.name.includes("presentation"))).toBe(true);
  });

  test("should search within specific list", () => {
    const workList = createList({ name: "Work" });
    const homeList = createList({ name: "Home" });

    createTask({ listId: workList.id, name: "Work meeting" });
    createTask({ listId: homeList.id, name: "Home meeting" });

    const results = searchTasks("meeting", { listId: workList.id });
    
    expect(results.every((r) => r.item.listId === workList.id)).toBe(true);
    expect(results.some((r) => r.item.name === "Work meeting")).toBe(true);
    expect(results.some((r) => r.item.name === "Home meeting")).toBe(false);
  });

  test("should filter search by completion status", () => {
    const list = createList({ name: "Status Test" });
    const { toggleTaskCompletion } = require("@/lib/db/repositories");

    const activeTask = createTask({
      listId: list.id,
      name: "Active task",
    });

    const completedTask = createTask({
      listId: list.id,
      name: "Completed task",
    });
    toggleTaskCompletion(completedTask.id);

    // Search for active only
    const activeResults = searchTasks("task", { isCompleted: false });
    expect(activeResults.some((r) => r.item.id === activeTask.id)).toBe(true);
    expect(activeResults.some((r) => r.item.id === completedTask.id)).toBe(false);

    // Search for completed only
    const completedResults = searchTasks("task", { isCompleted: true });
    expect(completedResults.some((r) => r.item.id === completedTask.id)).toBe(true);
    expect(completedResults.some((r) => r.item.id === activeTask.id)).toBe(false);
  });

  test("should suggest task and label names", () => {
    const list = createList({ name: "Suggestion Test" });

    createTask({ listId: list.id, name: "Alpha task" });
    createTask({ listId: list.id, name: "Beta task" });
    createLabel({ name: "Alpha label" });

    const suggestions = getSearchSuggestions("Alp");
    
    expect(suggestions.includes("Alpha task")).toBe(true);
    expect(suggestions.includes("Alpha label")).toBe(true);
    expect(suggestions.includes("Beta task")).toBe(false);
  });

  test("should handle advanced search with date filters", () => {
    const list = createList({ name: "Date Filter Test" });

    createTask({
      listId: list.id,
      name: "January task",
      taskDate: "2025-01-15",
    });

    createTask({
      listId: list.id,
      name: "March task",
      taskDate: "2025-03-15",
    });

    const janResults = advancedSearch({
      dateFrom: "2025-01-01",
      dateTo: "2025-01-31",
    });

    expect(janResults.some((t) => t.name === "January task")).toBe(true);
    expect(janResults.some((t) => t.name === "March task")).toBe(false);
  });

  test("should search by label", () => {
    const list = createList({ name: "Label Search Test" });
    const label1 = createLabel({ name: "Important" });
    const label2 = createLabel({ name: "Later" });

    createTask({
      listId: list.id,
      name: "Important task",
      labelIds: [label1.id],
    });

    createTask({
      listId: list.id,
      name: "Later task",
      labelIds: [label2.id],
    });

    const results = advancedSearch({
      labelIds: [label1.id],
    });

    expect(results.some((t) => t.name === "Important task")).toBe(true);
    expect(results.some((t) => t.name === "Later task")).toBe(false);
  });
});