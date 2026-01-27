/**
 * Labels Repository Tests
 * Tests CRUD operations and task counts
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import {
  getAllLabels,
  getLabelById,
  getLabelByName,
  getLabelsByTaskId,
  getLabelsWithTaskCount,
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
  setTaskLabels,
  getOrCreateLabel,
} from "../labels";
import { createList, createTask } from "../tasks";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";

describe("Labels Repository", () => {
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

  describe("getAllLabels", () => {
    test("should return all labels ordered by name", () => {
      createLabel({ name: "Zebra" });
      createLabel({ name: "Apple" });
      createLabel({ name: "Banana" });

      const labels = getAllLabels();

      expect(labels.length).toBeGreaterThanOrEqual(3);
      
      // Check alphabetical ordering
      const names = labels.map((l) => l.name);
      expect(names.indexOf("Apple")).toBeLessThan(names.indexOf("Banana"));
      expect(names.indexOf("Banana")).toBeLessThan(names.indexOf("Zebra"));
    });

    test("should return labels with correct properties", () => {
      const labels = getAllLabels();
      
      if (labels.length > 0) {
        const label = labels[0];
        expect(label).toHaveProperty("id");
        expect(label).toHaveProperty("name");
        expect(label).toHaveProperty("color");
        expect(label).toHaveProperty("icon");
        expect(label).toHaveProperty("createdAt");
      }
    });
  });

  describe("getLabelById", () => {
    test("should return label by ID", () => {
      const created = createLabel({ name: "Test Label" });
      const found = getLabelById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe("Test Label");
    });

    test("should return null for non-existent label", () => {
      const found = getLabelById(99999);
      expect(found).toBeNull();
    });
  });

  describe("getLabelByName", () => {
    test("should find label by exact name", () => {
      createLabel({ name: "ExactMatch" });
      const found = getLabelByName("ExactMatch");

      expect(found).not.toBeNull();
      expect(found?.name).toBe("ExactMatch");
    });

    test("should find label case-insensitively", () => {
      createLabel({ name: "CaseTest" });
      const found = getLabelByName("casetest");

      expect(found).not.toBeNull();
      expect(found?.name).toBe("CaseTest");
    });

    test("should return null for non-existent name", () => {
      const found = getLabelByName("NonExistentLabel");
      expect(found).toBeNull();
    });
  });

  describe("createLabel", () => {
    test("should create label with default values", () => {
      const label = createLabel({ name: "New Label" });

      expect(label.name).toBe("New Label");
      expect(label.color).toBe("#8b5cf6"); // default color
      expect(label.icon).toBe("tag"); // default icon
      expect(label.id).toBeGreaterThan(0);
    });

    test("should create label with custom values", () => {
      const label = createLabel({
        name: "Custom Label",
        color: "#ff0000",
        icon: "star",
      });

      expect(label.name).toBe("Custom Label");
      expect(label.color).toBe("#ff0000");
      expect(label.icon).toBe("star");
    });

    test("should throw error when creating duplicate label", () => {
      createLabel({ name: "Duplicate" });

      expect(() => {
        createLabel({ name: "duplicate" }); // Same name, different case
      }).toThrow(/already exists/);
    });

    test("should throw error when creating label with empty name", () => {
      expect(() => {
        createLabel({ name: "" });
      }).toThrow();
    });
  });

  describe("updateLabel", () => {
    test("should update label name", () => {
      const created = createLabel({ name: "Original" });
      const updated = updateLabel(created.id, { name: "Updated" });

      expect(updated?.name).toBe("Updated");
    });

    test("should update label color", () => {
      const created = createLabel({ name: "Test", color: "#000000" });
      const updated = updateLabel(created.id, { color: "#ffffff" });

      expect(updated?.color).toBe("#ffffff");
      expect(updated?.name).toBe("Test"); // unchanged
    });

    test("should update label icon", () => {
      const created = createLabel({ name: "Test", icon: "tag" });
      const updated = updateLabel(created.id, { icon: "flag" });

      expect(updated?.icon).toBe("flag");
    });

    test("should update multiple fields", () => {
      const created = createLabel({ name: "Test" });
      const updated = updateLabel(created.id, {
        name: "New Name",
        color: "#123456",
        icon: "star",
      });

      expect(updated?.name).toBe("New Name");
      expect(updated?.color).toBe("#123456");
      expect(updated?.icon).toBe("star");
    });

    test("should throw error when renaming to existing label name", () => {
      createLabel({ name: "Existing" });
      const toUpdate = createLabel({ name: "To Update" });

      expect(() => {
        updateLabel(toUpdate.id, { name: "existing" });
      }).toThrow(/already exists/);
    });

    test("should return null when updating non-existent label", () => {
      const updated = updateLabel(99999, { name: "New Name" });
      expect(updated).toBeNull();
    });

    test("should return unchanged label when no updates provided", () => {
      const created = createLabel({ name: "Test" });
      const updated = updateLabel(created.id, {});

      expect(updated?.name).toBe("Test");
      expect(updated?.id).toBe(created.id);
    });
  });

  describe("deleteLabel", () => {
    test("should delete a label", () => {
      const created = createLabel({ name: "To Delete" });
      const deleted = deleteLabel(created.id);

      expect(deleted).toBe(true);
      expect(getLabelById(created.id)).toBeNull();
    });

    test("should return false when deleting non-existent label", () => {
      const deleted = deleteLabel(99999);
      expect(deleted).toBe(false);
    });

    test("should remove label associations when deleting", () => {
      const list = createTestList();
      const label = createLabel({ name: "To Delete" });
      const task = createTask({
        listId: list.id,
        name: "Task",
        labelIds: [label.id],
      });

      // Delete the label
      deleteLabel(label.id);

      // Label should be removed from task
      const labels = getLabelsByTaskId(task.id);
      expect(labels.some((l) => l.id === label.id)).toBe(false);
    });
  });

  describe("getLabelsByTaskId", () => {
    test("should return labels for a task", () => {
      const list = createTestList();
      const label1 = createLabel({ name: "Label 1" });
      const label2 = createLabel({ name: "Label 2" });

      const task = createTask({
        listId: list.id,
        name: "Task",
        labelIds: [label1.id, label2.id],
      });

      const labels = getLabelsByTaskId(task.id);

      expect(labels.length).toBe(2);
      expect(labels.map((l) => l.name)).toContain("Label 1");
      expect(labels.map((l) => l.name)).toContain("Label 2");
    });

    test("should return empty array for task without labels", () => {
      const list = createTestList();
      const task = createTask({ listId: list.id, name: "No Labels" });

      const labels = getLabelsByTaskId(task.id);

      expect(labels).toEqual([]);
    });

    test("should return labels ordered by name", () => {
      const list = createTestList();
      const labelZ = createLabel({ name: "Zebra" });
      const labelA = createLabel({ name: "Apple" });

      createTask({
        listId: list.id,
        name: "Task",
        labelIds: [labelZ.id, labelA.id],
      });

      const labels = getLabelsByTaskId(list.id); // Wrong ID, should be task.id
      // This test is incorrect - we need to get the task first
      const tasks = require("../tasks");
      const task = createTask({
        listId: list.id,
        name: "Task",
        labelIds: [labelZ.id, labelA.id],
      });

      const taskLabels = getLabelsByTaskId(task.id);
      const names = taskLabels.map((l) => l.name);
      
      expect(names.indexOf("Apple")).toBeLessThan(names.indexOf("Zebra"));
    });
  });

  describe("getLabelsWithTaskCount", () => {
    test("should return labels with task counts", () => {
      const list = createTestList();
      const label = createLabel({ name: "Counted Label" });

      createTask({ listId: list.id, name: "Task 1", labelIds: [label.id] });
      createTask({ listId: list.id, name: "Task 2", labelIds: [label.id] });

      const labelsWithCount = getLabelsWithTaskCount();
      const found = labelsWithCount.find((l) => l.id === label.id);

      expect(found?.taskCount).toBe(2);
    });

    test("should return zero count for unused labels", () => {
      const label = createLabel({ name: "Unused" });

      const labelsWithCount = getLabelsWithTaskCount();
      const found = labelsWithCount.find((l) => l.id === label.id);

      expect(found?.taskCount).toBe(0);
    });
  });

  describe("addLabelToTask", () => {
    test("should add label to task", () => {
      const list = createTestList();
      const label = createLabel({ name: "To Add" });
      const task = createTask({ listId: list.id, name: "Task" });

      const added = addLabelToTask(task.id, label.id);

      expect(added).toBe(true);
      
      const labels = getLabelsByTaskId(task.id);
      expect(labels.some((l) => l.id === label.id)).toBe(true);
    });

    test("should return false when label already added", () => {
      const list = createTestList();
      const label = createLabel({ name: "Already Added" });
      const task = createTask({
        listId: list.id,
        name: "Task",
        labelIds: [label.id],
      });

      const added = addLabelToTask(task.id, label.id);
      expect(added).toBe(false);
    });
  });

  describe("removeLabelFromTask", () => {
    test("should remove label from task", () => {
      const list = createTestList();
      const label = createLabel({ name: "To Remove" });
      const task = createTask({
        listId: list.id,
        name: "Task",
        labelIds: [label.id],
      });

      const removed = removeLabelFromTask(task.id, label.id);

      expect(removed).toBe(true);
      
      const labels = getLabelsByTaskId(task.id);
      expect(labels.some((l) => l.id === label.id)).toBe(false);
    });

    test("should return false when label not on task", () => {
      const list = createTestList();
      const label = createLabel({ name: "Not Added" });
      const task = createTask({ listId: list.id, name: "Task" });

      const removed = removeLabelFromTask(task.id, label.id);
      expect(removed).toBe(false);
    });
  });

  describe("setTaskLabels", () => {
    test("should replace all task labels", () => {
      const list = createTestList();
      const oldLabel = createLabel({ name: "Old" });
      const newLabel1 = createLabel({ name: "New 1" });
      const newLabel2 = createLabel({ name: "New 2" });

      const task = createTask({
        listId: list.id,
        name: "Task",
        labelIds: [oldLabel.id],
      });

      setTaskLabels(task.id, [newLabel1.id, newLabel2.id]);

      const labels = getLabelsByTaskId(task.id);
      expect(labels.length).toBe(2);
      expect(labels.some((l) => l.name === "New 1")).toBe(true);
      expect(labels.some((l) => l.name === "New 2")).toBe(true);
      expect(labels.some((l) => l.name === "Old")).toBe(false);
    });

    test("should remove all labels when given empty array", () => {
      const list = createTestList();
      const label = createLabel({ name: "To Remove" });
      const task = createTask({
        listId: list.id,
        name: "Task",
        labelIds: [label.id],
      });

      setTaskLabels(task.id, []);

      const labels = getLabelsByTaskId(task.id);
      expect(labels).toEqual([]);
    });
  });

  describe("getOrCreateLabel", () => {
    test("should return existing label", () => {
      const existing = createLabel({ name: "Existing" });
      const found = getOrCreateLabel("existing"); // Case insensitive

      expect(found.id).toBe(existing.id);
      expect(found.name).toBe("Existing");
    });

    test("should create new label if not exists", () => {
      const created = getOrCreateLabel("Brand New Label");

      expect(created.name).toBe("Brand New Label");
      expect(created.id).toBeGreaterThan(0);
      
      // Verify it was actually created
      expect(getLabelByName("Brand New Label")).not.toBeNull();
    });

    test("should create label with custom color and icon", () => {
      const created = getOrCreateLabel("Styled Label", "#ff0000", "star");

      expect(created.color).toBe("#ff0000");
      expect(created.icon).toBe("star");
    });
  });
});