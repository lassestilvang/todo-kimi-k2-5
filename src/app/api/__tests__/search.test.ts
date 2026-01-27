/**
 * Search API Route Tests
 * Tests GET /api/search endpoint
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { GET as search } from "../search/route";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";
import { createMockRequest } from "./test-helpers";

describe("Search API", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  // Helper to create test data
  async function createTestData() {
    const { createList } = await import("@/lib/db/repositories");
    const { createTask } = await import("@/lib/db/repositories");
    const { createLabel } = await import("@/lib/db/repositories");

    const list = createList({ name: "Test List" });
    const task = createTask({ listId: list.id, name: "Test Task" });
    const label = createLabel({ name: "Test Label" });

    return { list, task, label };
  }

  describe("GET /api/search", () => {
    test("should return 400 for missing query", async () => {
      const request = createMockRequest("http://localhost:3000/api/search");
      const response = await search(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain("required");
    });

    test("should perform global search by default", async () => {
      await createTestData();

      const request = createMockRequest("http://localhost:3000/api/search?q=test");
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("tasks");
      expect(data).toHaveProperty("labels");
      expect(data).toHaveProperty("type", "global");
      expect(data).toHaveProperty("totalResults");
    });

    test("should search tasks only with type=tasks", async () => {
      await createTestData();

      const request = createMockRequest("http://localhost:3000/api/search?q=test&type=tasks");
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("tasks");
      expect(data).toHaveProperty("scores");
      expect(data).toHaveProperty("type", "tasks");
      expect(data).not.toHaveProperty("labels");
    });

    test("should search labels only with type=labels", async () => {
      await createTestData();

      const request = createMockRequest("http://localhost:3000/api/search?q=test&type=labels");
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("labels");
      expect(data).toHaveProperty("scores");
      expect(data).toHaveProperty("type", "labels");
      expect(data).not.toHaveProperty("tasks");
    });

    test("should perform quick search with type=quick", async () => {
      await createTestData();

      const request = createMockRequest("http://localhost:3000/api/search?q=test&type=quick");
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("tasks");
      expect(data).toHaveProperty("type", "quick");
    });

    test("should return suggestions with type=suggestions", async () => {
      await createTestData();

      const request = createMockRequest("http://localhost:3000/api/search?q=te&type=suggestions");
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("suggestions");
      expect(data).toHaveProperty("type", "suggestions");
      expect(Array.isArray(data.suggestions)).toBe(true);
    });

    test("should perform advanced search with filters", async () => {
      const { list } = await createTestData();

      const request = createMockRequest(
        `http://localhost:3000/api/search?q=test&listId=${list.id}&priority=high`
      );
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("tasks");
      expect(data).toHaveProperty("type", "advanced");
    });

    test("should respect limit parameter", async () => {
      await createTestData();

      const request = createMockRequest("http://localhost:3000/api/search?q=test&limit=5");
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.tasks.length).toBeLessThanOrEqual(5);
    });

    test("should filter by date range", async () => {
      await createTestData();

      const request = createMockRequest(
        `http://localhost:3000/api/search?q=test&dateFrom=2025-01-01&dateTo=2025-12-31`
      );
      const response = await search(request);

      expect(response.status).toBe(200);
    });

    test("should filter by isCompleted", async () => {
      await createTestData();

      const request = createMockRequest("http://localhost:3000/api/search?q=test&isCompleted=false");
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      if (data.type === "advanced" && data.tasks) {
        expect(data.tasks.every((t: { isCompleted: boolean }) => !t.isCompleted)).toBe(true);
      }
    });

    test("should handle URL-encoded query", async () => {
      await createTestData();

      const request = createMockRequest("http://localhost:3000/api/search?q=hello%20world");
      const response = await search(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.query).toBe("hello world");
    });
  });
});