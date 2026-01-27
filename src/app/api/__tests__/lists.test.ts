/**
 * Lists API Route Tests
 * Tests GET, POST, PUT, DELETE /api/lists
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { GET as getLists, POST as createList } from "../lists/route";
import { GET as getList, PUT as updateList, DELETE as deleteList } from "../lists/[id]/route";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";
import { createMockRequest, createMockParams } from "./test-helpers";

describe("Lists API", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  describe("GET /api/lists", () => {
    test("should return all lists with task counts", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists");
      const response = await getLists();

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("lists");
      expect(Array.isArray(data.lists)).toBe(true);
      
      // Should include default Inbox
      expect(data.lists.some((l: { name: string }) => l.name === "Inbox")).toBe(true);
    });

    test("should include taskCount in response", async () => {
      const response = await getLists();
      const data = await response.json();

      if (data.lists.length > 0) {
        expect(data.lists[0]).toHaveProperty("taskCount");
        expect(typeof data.lists[0].taskCount).toBe("number");
      }
    });
  });

  describe("POST /api/lists", () => {
    test("should create a new list", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: {
          name: "New Test List",
          color: "#ff0000",
          emoji: "🚀",
        },
      });

      const response = await createList(request);

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty("list");
      expect(data.list.name).toBe("New Test List");
      expect(data.list.color).toBe("#ff0000");
      expect(data.list.emoji).toBe("🚀");
    });

    test("should create list with defaults", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: {
          name: "Minimal List",
        },
      });

      const response = await createList(request);
      const data = await response.json();

      expect(data.list.name).toBe("Minimal List");
      expect(data.list.color).toBe("#6366f1"); // default
      expect(data.list.emoji).toBe("📥"); // default
    });

    test("should return 400 for invalid input", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: {
          name: "", // Empty name is invalid
        },
      });

      const response = await createList(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    test("should return 400 for invalid color format", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: {
          name: "Test List",
          color: "not-a-color",
        },
      });

      const response = await createList(request);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/lists/[id]", () => {
    test("should return a list by ID", async () => {
      // First create a list
      const createRequest = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: { name: "Get By ID Test" },
      });
      const createResponse = await createList(createRequest);
      const { list: createdList } = await createResponse.json();

      // Now fetch it
      const request = createMockRequest(`http://localhost:3000/api/lists/${createdList.id}`);
      const response = await getList(request, { params: createMockParams({ id: createdList.id.toString() }) });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.list.id).toBe(createdList.id);
      expect(data.list.name).toBe("Get By ID Test");
    });

    test("should return 404 for non-existent list", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists/99999");
      const response = await getList(request, { params: createMockParams({ id: "99999" }) });

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe("List not found");
    });

    test("should return 400 for invalid ID", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists/invalid");
      const response = await getList(request, { params: createMockParams({ id: "invalid" }) });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain("Invalid");
    });
  });

  describe("PUT /api/lists/[id]", () => {
    test("should update a list", async () => {
      // Create a list first
      const createRequest = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: { name: "Original Name" },
      });
      const createResponse = await createList(createRequest);
      const { list: createdList } = await createResponse.json();

      // Update it
      const updateRequest = createMockRequest(`http://localhost:3000/api/lists/${createdList.id}`, {
        method: "PUT",
        body: { name: "Updated Name" },
      });
      const response = await updateList(updateRequest, { params: createMockParams({ id: createdList.id.toString() }) });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.list.name).toBe("Updated Name");
    });

    test("should update multiple fields", async () => {
      // Create a list first
      const createRequest = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: { name: "Test" },
      });
      const createResponse = await createList(createRequest);
      const { list: createdList } = await createResponse.json();

      // Update multiple fields
      const updateRequest = createMockRequest(`http://localhost:3000/api/lists/${createdList.id}`, {
        method: "PUT",
        body: {
          name: "New Name",
          color: "#00ff00",
          emoji: "⭐",
        },
      });
      const response = await updateList(updateRequest, { params: createMockParams({ id: createdList.id.toString() }) });

      const data = await response.json();
      expect(data.list.name).toBe("New Name");
      expect(data.list.color).toBe("#00ff00");
      expect(data.list.emoji).toBe("⭐");
    });

    test("should return 404 for non-existent list", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists/99999", {
        method: "PUT",
        body: { name: "New Name" },
      });
      const response = await updateList(request, { params: createMockParams({ id: "99999" }) });

      expect(response.status).toBe(404);
    });

    test("should return 400 for invalid input", async () => {
      // Create a list first
      const createRequest = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: { name: "Test" },
      });
      const createResponse = await createList(createRequest);
      const { list: createdList } = await createResponse.json();

      const updateRequest = createMockRequest(`http://localhost:3000/api/lists/${createdList.id}`, {
        method: "PUT",
        body: { name: "" }, // Invalid
      });
      const response = await updateList(updateRequest, { params: createMockParams({ id: createdList.id.toString() }) });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/lists/[id]", () => {
    test("should delete a list", async () => {
      // Create a list first
      const createRequest = createMockRequest("http://localhost:3000/api/lists", {
        method: "POST",
        body: { name: "To Delete" },
      });
      const createResponse = await createList(createRequest);
      const { list: createdList } = await createResponse.json();

      // Delete it
      const request = createMockRequest(`http://localhost:3000/api/lists/${createdList.id}`, {
        method: "DELETE",
      });
      const response = await deleteList(request, { params: createMockParams({ id: createdList.id.toString() }) });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toContain("deleted");

      // Verify it's gone
      const getRequest = createMockRequest(`http://localhost:3000/api/lists/${createdList.id}`);
      const getResponse = await getList(getRequest, { params: createMockParams({ id: createdList.id.toString() }) });
      expect(getResponse.status).toBe(404);
    });

    test("should return 404 for non-existent list", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists/99999", {
        method: "DELETE",
      });
      const response = await deleteList(request, { params: createMockParams({ id: "99999" }) });

      expect(response.status).toBe(404);
    });

    test("should return 403 when trying to delete Inbox", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists/1", {
        method: "DELETE",
      });
      const response = await deleteList(request, { params: createMockParams({ id: "1" }) });

      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toContain("Inbox");
    });

    test("should return 400 for invalid ID", async () => {
      const request = createMockRequest("http://localhost:3000/api/lists/invalid", {
        method: "DELETE",
      });
      const response = await deleteList(request, { params: createMockParams({ id: "invalid" }) });

      expect(response.status).toBe(400);
    });
  });
});