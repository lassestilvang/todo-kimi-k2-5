/**
 * List Management Integration Test
 * Tests complete flow: Create list → Add tasks → Delete list
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";
import {
  createList,
  getAllLists,
  getListById,
  updateList,
  deleteList,
  getListWithTaskCount,
  getAllListsWithTaskCounts,
  updateListsSortOrder,
} from "@/lib/db/repositories";
import { createTask, getTasksByListId, deleteTask } from "@/lib/db/repositories";

describe("List Management Integration", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  test("should complete full list lifecycle with tasks", () => {
    // Step 1: Create a new list
    const list = createList({
      name: "Project Alpha",
      color: "#3b82f6",
      emoji: "🚀",
      sortOrder: 10,
    });
    
    expect(list.id).toBeGreaterThan(0);
    expect(list.name).toBe("Project Alpha");
    expect(list.color).toBe("#3b82f6");
    expect(list.emoji).toBe("🚀");

    // Step 2: Verify list appears in all lists
    const allLists = getAllLists();
    expect(allLists.some((l) => l.id === list.id)).toBe(true);

    // Step 3: Add tasks to the list
    const task1 = createTask({
      listId: list.id,
      name: "Set up project structure",
      priority: "high",
    });

    const task2 = createTask({
      listId: list.id,
      name: "Configure CI/CD",
      priority: "medium",
    });

    const task3 = createTask({
      listId: list.id,
      name: "Write initial documentation",
      priority: "low",
    });

    expect(task1.listId).toBe(list.id);
    expect(task2.listId).toBe(list.id);
    expect(task3.listId).toBe(list.id);

    // Step 4: Verify task count
    const listWithCount = getListWithTaskCount(list.id);
    expect(listWithCount?.taskCount).toBe(3);

    // Step 5: Verify tasks appear in list tasks
    const listTasks = getTasksByListId(list.id);
    expect(listTasks.length).toBe(3);

    // Step 6: Complete one task
    const { toggleTaskCompletion } = require("@/lib/db/repositories");
    toggleTaskCompletion(task3.id);

    // Step 7: Verify active task count decreased
    const listWithUpdatedCount = getListWithTaskCount(list.id);
    expect(listWithUpdatedCount?.taskCount).toBe(2); // Only active tasks

    // Step 8: Update list details
    const updatedList = updateList(list.id, {
      name: "Project Alpha - Updated",
      color: "#10b981",
      emoji: "✅",
    });

    expect(updatedList?.name).toBe("Project Alpha - Updated");
    expect(updatedList?.color).toBe("#10b981");
    expect(updatedList?.emoji).toBe("✅");

    // Step 9: Verify tasks still belong to list after update
    const tasksAfterUpdate = getTasksByListId(list.id);
    expect(tasksAfterUpdate.length).toBe(3);

    // Step 10: Delete a task
    deleteTask(task1.id);
    const tasksAfterDelete = getTasksByListId(list.id);
    expect(tasksAfterDelete.length).toBe(2);

    // Step 11: Delete the list (should cascade delete remaining tasks)
    const deleted = deleteList(list.id);
    expect(deleted).toBe(true);

    // Step 12: Verify list is gone
    const goneList = getListById(list.id);
    expect(goneList).toBeNull();

    // Step 13: Verify all tasks in the list are also deleted
    const remainingTasks = getTasksByListId(list.id);
    expect(remainingTasks.length).toBe(0);
  });

  test("should manage multiple lists with ordering", () => {
    // Create lists with different sort orders
    const list1 = createList({ name: "First", sortOrder: 3 });
    const list2 = createList({ name: "Second", sortOrder: 1 });
    const list3 = createList({ name: "Third", sortOrder: 2 });

    // Verify initial order
    let lists = getAllLists();
    const ourLists = lists.filter((l) => [list1.id, list2.id, list3.id].includes(l.id));
    expect(ourLists[0].id).toBe(list2.id); // sortOrder 1
    expect(ourLists[1].id).toBe(list3.id); // sortOrder 2
    expect(ourLists[2].id).toBe(list1.id); // sortOrder 3

    // Reorder lists
    updateListsSortOrder([list1.id, list3.id, list2.id]);

    // Verify new order
    lists = getAllLists();
    const reorderedLists = lists.filter((l) => [list1.id, list2.id, list3.id].includes(l.id));
    expect(reorderedLists[0].id).toBe(list1.id);
    expect(reorderedLists[1].id).toBe(list3.id);
    expect(reorderedLists[2].id).toBe(list2.id);
  });

  test("should handle list with many tasks", () => {
    const list = createList({ name: "Bulk Test List" });

    // Create many tasks
    for (let i = 0; i < 20; i++) {
      createTask({
        listId: list.id,
        name: `Task ${i}`,
        priority: i % 2 === 0 ? "high" : "low",
      });
    }

    // Verify all tasks
    const tasks = getTasksByListId(list.id, true); // Include completed
    expect(tasks.length).toBe(20);

    // Verify task count
    const listWithCount = getListWithTaskCount(list.id);
    expect(listWithCount?.taskCount).toBe(20);

    // Delete list and verify cascade
    deleteList(list.id);
    expect(getTasksByListId(list.id, true).length).toBe(0);
  });

  test("should not allow deleting Inbox list", () => {
    expect(() => deleteList(1)).toThrow("Cannot delete the Inbox list");
    
    // Verify Inbox still exists
    const inbox = getListById(1);
    expect(inbox).not.toBeNull();
    expect(inbox?.name).toBe("Inbox");
  });

  test("should track task counts across lists", () => {
    const list1 = createList({ name: "List 1" });
    const list2 = createList({ name: "List 2" });

    // Add tasks to each list
    createTask({ listId: list1.id, name: "Task A" });
    createTask({ listId: list1.id, name: "Task B" });
    createTask({ listId: list2.id, name: "Task C" });

    // Get all lists with counts
    const listsWithCounts = getAllListsWithTaskCounts();
    const list1Data = listsWithCounts.find((l) => l.id === list1.id);
    const list2Data = listsWithCounts.find((l) => l.id === list2.id);

    expect(list1Data?.taskCount).toBe(2);
    expect(list2Data?.taskCount).toBe(1);
  });
});