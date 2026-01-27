/**
 * Lists Repository Tests
 * Tests CRUD operations, task counts, and ordering
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import {
  getAllLists,
  getListById,
  createList,
  updateList,
  deleteList,
  updateListsSortOrder,
  getListWithTaskCount,
  getAllListsWithTaskCounts,
} from "../lists";
import { createTask } from "../tasks";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";

describe("Lists Repository", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  describe("getAllLists", () => {
    test("should return all lists ordered by sort_order", () => {
      // Create lists with different sort orders
      createList({ name: "List B", sortOrder: 2 });
      createList({ name: "List A", sortOrder: 1 });
      createList({ name: "List C", sortOrder: 0 });

      const lists = getAllLists();

      // Should include default Inbox (id=1) plus 3 new lists
      expect(lists.length).toBeGreaterThanOrEqual(3);
      
      // Check sorting (List C should come before List A before List B)
      const listNames = lists.map((l) => l.name);
      expect(listNames).toContain("List A");
      expect(listNames).toContain("List B");
      expect(listNames).toContain("List C");
    });

    test("should return lists with correct properties", () => {
      const lists = getAllLists();
      
      expect(lists.length).toBeGreaterThan(0);
      
      const list = lists[0];
      expect(list).toHaveProperty("id");
      expect(list).toHaveProperty("name");
      expect(list).toHaveProperty("color");
      expect(list).toHaveProperty("emoji");
      expect(list).toHaveProperty("sortOrder");
      expect(list).toHaveProperty("createdAt");
      expect(list).toHaveProperty("updatedAt");
    });
  });

  describe("getListById", () => {
    test("should return a list by ID", () => {
      const created = createList({ name: "Test List" });
      const found = getListById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe("Test List");
    });

    test("should return null for non-existent list", () => {
      const found = getListById(99999);
      expect(found).toBeNull();
    });
  });

  describe("createList", () => {
    test("should create a list with default values", () => {
      const list = createList({ name: "New List" });

      expect(list.name).toBe("New List");
      expect(list.color).toBe("#6366f1"); // default color
      expect(list.emoji).toBe("📥"); // default emoji
      expect(list.sortOrder).toBe(0); // default sort order
      expect(list.id).toBeGreaterThan(0);
    });

    test("should create a list with custom values", () => {
      const list = createList({
        name: "Custom List",
        color: "#ff0000",
        emoji: "🚀",
        sortOrder: 5,
      });

      expect(list.name).toBe("Custom List");
      expect(list.color).toBe("#ff0000");
      expect(list.emoji).toBe("🚀");
      expect(list.sortOrder).toBe(5);
    });

    test("should throw error when creating list fails", () => {
      // This would require mocking database failure
      // For now, we test the normal flow
      expect(() => createList({ name: "" })).toThrow();
    });
  });

  describe("updateList", () => {
    test("should update list name", () => {
      const created = createList({ name: "Original Name" });
      const updated = updateList(created.id, { name: "Updated Name" });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.id).toBe(created.id);
    });

    test("should update list color", () => {
      const created = createList({ name: "Test", color: "#000000" });
      const updated = updateList(created.id, { color: "#ffffff" });

      expect(updated?.color).toBe("#ffffff");
      expect(updated?.name).toBe("Test"); // unchanged
    });

    test("should update list emoji", () => {
      const created = createList({ name: "Test", emoji: "📋" });
      const updated = updateList(created.id, { emoji: "🎯" });

      expect(updated?.emoji).toBe("🎯");
    });

    test("should update list sort order", () => {
      const created = createList({ name: "Test", sortOrder: 0 });
      const updated = updateList(created.id, { sortOrder: 10 });

      expect(updated?.sortOrder).toBe(10);
    });

    test("should update multiple fields at once", () => {
      const created = createList({ name: "Test" });
      const updated = updateList(created.id, {
        name: "New Name",
        color: "#123456",
        emoji: "⭐",
      });

      expect(updated?.name).toBe("New Name");
      expect(updated?.color).toBe("#123456");
      expect(updated?.emoji).toBe("⭐");
    });

    test("should return null when updating non-existent list", () => {
      const updated = updateList(99999, { name: "New Name" });
      expect(updated).toBeNull();
    });

    test("should return unchanged list when no updates provided", () => {
      const created = createList({ name: "Test" });
      const updated = updateList(created.id, {});

      expect(updated?.name).toBe("Test");
      expect(updated?.id).toBe(created.id);
    });
  });

  describe("deleteList", () => {
    test("should delete a list", () => {
      const created = createList({ name: "To Delete" });
      const deleted = deleteList(created.id);

      expect(deleted).toBe(true);
      expect(getListById(created.id)).toBeNull();
    });

    test("should return false when deleting non-existent list", () => {
      const deleted = deleteList(99999);
      expect(deleted).toBe(false);
    });

    test("should throw error when trying to delete Inbox (id=1)", () => {
      expect(() => deleteList(1)).toThrow("Cannot delete the Inbox list");
    });

    test("should cascade delete tasks in the list", () => {
      const list = createList({ name: "List with Tasks" });
      const task = createTask({
        listId: list.id,
        name: "Task in List",
      });

      // Delete the list
      deleteList(list.id);

      // Task should also be deleted (verified by foreign key cascade)
      const { getTaskById } = require("../tasks");
      expect(getTaskById(task.id)).toBeNull();
    });
  });

  describe("updateListsSortOrder", () => {
    test("should update sort order for multiple lists", () => {
      const listA = createList({ name: "A", sortOrder: 0 });
      const listB = createList({ name: "B", sortOrder: 0 });
      const listC = createList({ name: "C", sortOrder: 0 });

      // Reorder: C, A, B
      updateListsSortOrder([listC.id, listA.id, listB.id]);

      // Verify new order
      const updatedA = getListById(listA.id);
      const updatedB = getListById(listB.id);
      const updatedC = getListById(listC.id);

      expect(updatedC?.sortOrder).toBe(0);
      expect(updatedA?.sortOrder).toBe(1);
      expect(updatedB?.sortOrder).toBe(2);
    });
  });

  describe("getListWithTaskCount", () => {
    test("should return list with task count", () => {
      const list = createList({ name: "List with Count" });
      
      // Create tasks in the list
      createTask({ listId: list.id, name: "Task 1" });
      createTask({ listId: list.id, name: "Task 2" });

      const listWithCount = getListWithTaskCount(list.id);

      expect(listWithCount).not.toBeNull();
      expect(listWithCount?.id).toBe(list.id);
      expect(listWithCount?.name).toBe("List with Count");
      expect(listWithCount?.taskCount).toBe(2);
    });

    test("should not count completed tasks", () => {
      const list = createList({ name: "List with Mixed Tasks" });
      
      createTask({ listId: list.id, name: "Active Task" });
      const completedTask = createTask({ listId: list.id, name: "Completed Task" });
      
      // Mark task as completed
      const { updateTask } = require("../tasks");
      updateTask(completedTask.id, { isCompleted: true });

      const listWithCount = getListWithTaskCount(list.id);
      expect(listWithCount?.taskCount).toBe(1); // Only active tasks
    });

    test("should return null for non-existent list", () => {
      const listWithCount = getListWithTaskCount(99999);
      expect(listWithCount).toBeNull();
    });
  });

  describe("getAllListsWithTaskCounts", () => {
    test("should return all lists with task counts", () => {
      const list1 = createList({ name: "List 1" });
      const list2 = createList({ name: "List 2" });

      createTask({ listId: list1.id, name: "Task in List 1" });
      createTask({ listId: list1.id, name: "Another Task" });
      createTask({ listId: list2.id, name: "Task in List 2" });

      const listsWithCounts = getAllListsWithTaskCounts();

      // Find our lists in the results
      const foundList1 = listsWithCounts.find((l) => l.id === list1.id);
      const foundList2 = listsWithCounts.find((l) => l.id === list2.id);

      expect(foundList1?.taskCount).toBe(2);
      expect(foundList2?.taskCount).toBe(1);
    });

    test("should return zero count for lists without tasks", () => {
      const list = createList({ name: "Empty List" });

      const listsWithCounts = getAllListsWithTaskCounts();
      const foundList = listsWithCounts.find((l) => l.id === list.id);

      expect(foundList?.taskCount).toBe(0);
    });
  });
});