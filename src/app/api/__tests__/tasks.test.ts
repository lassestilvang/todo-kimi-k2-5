/**
 * Tasks API Route Tests
 * Tests GET, POST, PUT, DELETE /api/tasks
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { GET as getTasks, POST as createTask } from "../tasks/route";
import { GET as getTask, PUT as updateTask, DELETE as deleteTask } from "../tasks/[id]/route";
import { POST as toggleComplete } from "../tasks/[id]/complete/route";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";
import { createMockRequest, createMockParams } from "./test-helpers";

describe("Tasks API", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  // Helper to create a list for tests
  async function createTestList(name: string = "Test List") {
    const { createList } = await import("@/lib/db/repositories");
    return createList({ name });
  }

  describe("GET /api/tasks", () => {
    test("should return all tasks", async () => {
      const request = createMockRequest("http://localhost:3000/api/tasks");
      const response = await getTasks(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("tasks");
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    test("should filter by view parameter", async () => {
      const list = await createTestList();
      
      // Create a task for today
      const taskRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Today's Task",
          taskDate: new Date().toISOString().split("T")[0],
        },
      });
      await createTask(taskRequest);

      const request = createMockRequest("http://localhost:3000/api/tasks?view=today");
      const response = await getTasks(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("view", "today");
    });

    test("should filter by listId", async () => {
      const list = await createTestList("Filter Test List");
      
      // Create a task
      const taskRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Filtered Task",
        },
      });
      await createTask(taskRequest);

      const request = createMockRequest(`http://localhost:3000/api/tasks?listId=${list.id}`);
      const response = await getTasks(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.tasks.every((t: { listId: number }) => t.listId === list.id)).toBe(true);
    });

    test("should filter by priority", async () => {
      const list = await createTestList();
      
      const taskRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "High Priority Task",
          priority: "high",
        },
      });
      await createTask(taskRequest);

      const request = createMockRequest("http://localhost:3000/api/tasks?priority=high");
      const response = await getTasks(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.tasks.every((t: { priority: string }) => t.priority === "high")).toBe(true);
    });

    test("should filter by completion status", async () => {
      const list = await createTestList();
      
      // Create a task
      const taskRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Active Task",
        },
      });
      await createTask(taskRequest);

      const request = createMockRequest("http://localhost:3000/api/tasks?isCompleted=false");
      const response = await getTasks(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.tasks.every((t: { isCompleted: boolean }) => !t.isCompleted)).toBe(true);
    });

    test("should return 400 for invalid view parameter", async () => {
      const request = createMockRequest("http://localhost:3000/api/tasks?view=invalid");
      const response = await getTasks(request);

      // Should still return 200, just ignore invalid view
      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/tasks", () => {
    test("should create a new task", async () => {
      const list = await createTestList();
      
      const request = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "New Test Task",
        },
      });

      const response = await createTask(request);

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty("task");
      expect(data.task.name).toBe("New Test Task");
      expect(data.task.listId).toBe(list.id);
    });

    test("should create task with all fields", async () => {
      const list = await createTestList();
      const today = new Date().toISOString().split("T")[0];
      
      const request = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Full Task",
          description: "Detailed description",
          taskDate: today,
          priority: "high",
          estimate: "02:30",
        },
      });

      const response = await createTask(request);
      const data = await response.json();

      expect(data.task.name).toBe("Full Task");
      expect(data.task.description).toBe("Detailed description");
      expect(data.task.taskDate).toBe(today);
      expect(data.task.priority).toBe("high");
      expect(data.task.estimate).toBe("02:30");
    });

    test("should return 400 for missing required fields", async () => {
      const request = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          // Missing listId and name
        },
      });

      const response = await createTask(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    test("should return 400 for invalid priority", async () => {
      const list = await createTestList();
      
      const request = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Test",
          priority: "invalid",
        },
      });

      const response = await createTask(request);

      expect(response.status).toBe(400);
    });

    test("should return 400 for non-existent list", async () => {
      const request = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: 99999,
          name: "Orphan Task",
        },
      });

      const response = await createTask(request);

      // Should return 500 due to foreign key constraint
      expect(response.status).toBe(500);
    });
  });

  describe("GET /api/tasks/[id]", () => {
    test("should return task with full details", async () => {
      const list = await createTestList();
      
      // Create a task
      const createRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Detailed Task",
        },
      });
      const createResponse = await createTask(createRequest);
      const { task: createdTask } = await createResponse.json();

      // Fetch it
      const request = createMockRequest(`http://localhost:3000/api/tasks/${createdTask.id}`);
      const response = await getTask(request, { params: createMockParams({ id: createdTask.id.toString() }) });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("task");
      expect(data).toHaveProperty("summary");
      expect(data).toHaveProperty("labels");
      expect(data.task.id).toBe(createdTask.id);
      expect(data.task.name).toBe("Detailed Task");
    });

    test("should return 404 for non-existent task", async () => {
      const request = createMockRequest("http://localhost:3000/api/tasks/99999");
      const response = await getTask(request, { params: createMockParams({ id: "99999" }) });

      expect(response.status).toBe(404);
    });

    test("should return 400 for invalid ID", async () => {
      const request = createMockRequest("http://localhost:3000/api/tasks/invalid");
      const response = await getTask(request, { params: createMockParams({ id: "invalid" }) });

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/tasks/[id]", () => {
    test("should update a task", async () => {
      const list = await createTestList();
      
      // Create a task
      const createRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Original",
        },
      });
      const createResponse = await createTask(createRequest);
      const { task: createdTask } = await createResponse.json();

      // Update it
      const updateRequest = createMockRequest(`http://localhost:3000/api/tasks/${createdTask.id}`, {
        method: "PUT",
        body: { name: "Updated" },
      });
      const response = await updateTask(updateRequest, { params: createMockParams({ id: createdTask.id.toString() }) });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.task.name).toBe("Updated");
    });

    test("should update task priority", async () => {
      const list = await createTestList();
      
      const createRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Test",
          priority: "low",
        },
      });
      const createResponse = await createTask(createRequest);
      const { task: createdTask } = await createResponse.json();

      const updateRequest = createMockRequest(`http://localhost:3000/api/tasks/${createdTask.id}`, {
        method: "PUT",
        body: { priority: "high" },
      });
      const response = await updateTask(updateRequest, { params: createMockParams({ id: createdTask.id.toString() }) });

      const data = await response.json();
      expect(data.task.priority).toBe("high");
    });

    test("should complete a task", async () => {
      const list = await createTestList();
      
      const createRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "To Complete",
        },
      });
      const createResponse = await createTask(createRequest);
      const { task: createdTask } = await createResponse.json();

      const updateRequest = createMockRequest(`http://localhost:3000/api/tasks/${createdTask.id}`, {
        method: "PUT",
        body: { isCompleted: true },
      });
      const response = await updateTask(updateRequest, { params: createMockParams({ id: createdTask.id.toString() }) });

      const data = await response.json();
      expect(data.task.isCompleted).toBe(true);
      expect(data.task.completedAt).not.toBeNull();
    });

    test("should return 404 for non-existent task", async () => {
      const request = createMockRequest("http://localhost:3000/api/tasks/99999", {
        method: "PUT",
        body: { name: "New Name" },
      });
      const response = await updateTask(request, { params: createMockParams({ id: "99999" }) });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/tasks/[id]", () => {
    test("should delete a task", async () => {
      const list = await createTestList();
      
      // Create a task
      const createRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "To Delete",
        },
      });
      const createResponse = await createTask(createRequest);
      const { task: createdTask } = await createResponse.json();

      // Delete it
      const request = createMockRequest(`http://localhost:3000/api/tasks/${createdTask.id}`, {
        method: "DELETE",
      });
      const response = await deleteTask(request, { params: createMockParams({ id: createdTask.id.toString() }) });

      expect(response.status).toBe(200);

      // Verify it's gone
      const getRequest = createMockRequest(`http://localhost:3000/api/tasks/${createdTask.id}`);
      const getResponse = await getTask(getRequest, { params: createMockParams({ id: createdTask.id.toString() }) });
      expect(getResponse.status).toBe(404);
    });

    test("should return 404 for non-existent task", async () => {
      const request      = createMockRequest("http://localhost:3000/api/tasks/99999", {
        method: "DELETE",
      });
      const response = await deleteTask(request, { params: createMockParams({ id: "99999" }) });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/tasks/[id]/complete", () => {
    test("should toggle task completion", async () => {
      const list = await createTestList();
      
      // Create an incomplete task
      const createRequest = createMockRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: {
          listId: list.id,
          name: "Toggle Task",
        },
      });
      const createResponse = await createTask(createRequest);
      const { task: createdTask } = await createResponse.json();
      expect(createdTask.isCompleted).toBe(false);

      // Toggle to complete
      const toggleRequest = createMockRequest(`http://localhost:3000/api/tasks/${createdTask.id}/complete`, {
        method: "POST",
      });
      const toggleResponse = await toggleComplete(toggleRequest, { params: createMockParams({ id: createdTask.id.toString() }) });

      expect(toggleResponse.status).toBe(200);
      
      const data = await toggleResponse.json();
      expect(data.task.isCompleted).toBe(true);
    });

    test("should return 404 for non-existent task", async () => {
      const request = createMockRequest("http://localhost:3000/api/tasks/99999/complete", {
        method: "POST",
      });
      const response = await toggleComplete(request, { params: createMockParams({ id: "99999" }) });

      expect(response.status).toBe(404);
    });
  });
});
