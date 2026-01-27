/**
 * Labels API Route Tests
 * Tests GET, POST /api/labels
 */

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { GET as getLabels, POST as createLabel } from "../labels/route";
import { setupTestDatabase, cleanupTestDatabase, silenceConsole, restoreConsole } from "@/test-setup";
import { createMockRequest } from "./test-helpers";

describe("Labels API", () => {
  beforeEach(() => {
    silenceConsole();
    setupTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    restoreConsole();
  });

  describe("GET /api/labels", () => {
    test("should return all labels with task counts", async () => {
      const response = await getLabels();

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("labels");
      expect(Array.isArray(data.labels)).toBe(true);
    });

    test("should include taskCount in response", async () => {
      const response = await getLabels();
      const data = await response.json();

      if (data.labels.length > 0) {
        expect(data.labels[0]).toHaveProperty("taskCount");
        expect(typeof data.labels[0].taskCount).toBe("number");
      }
    });
  });

  describe("POST /api/labels", () => {
    test("should create a new label", async () => {
      const request = createMockRequest("http://localhost:3000/api/labels", {
        method: "POST",
        body: {
          name: "New Test Label",
          color: "#ff0000",
          icon: "star",
        },
      });

      const response = await createLabel(request);

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty("label");
      expect(data.label.name).toBe("New Test Label");
      expect(data.label.color).toBe("#ff0000");
      expect(data.label.icon).toBe("star");
    });

    test("should create label with defaults", async () => {
      const request = createMockRequest("http://localhost:3000/api/labels", {
        method: "POST",
        body: {
          name: "Minimal Label",
        },
      });

      const response = await createLabel(request);
      const data = await response.json();

      expect(data.label.name).toBe("Minimal Label");
      expect(data.label.color).toBe("#8b5cf6"); // default
      expect(data.label.icon).toBe("tag"); // default
    });

    test("should return 400 for invalid input", async () => {
      const request = createMockRequest("http://localhost:3000/api/labels", {
        method: "POST",
        body: {
          name: "", // Empty name is invalid
        },
      });

      const response = await createLabel(request);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    test("should return 400 for invalid color format", async () => {
      const request = createMockRequest("http://localhost:3000/api/labels", {
        method: "POST",
        body: {
          name: "Test Label",
          color: "not-a-color",
        },
      });

      const response = await createLabel(request);

      expect(response.status).toBe(400);
    });

    test("should return 409 for duplicate label name", async () => {
      // Create first label
      const request1 = createMockRequest("http://localhost:3000/api/labels", {
        method: "POST",
        body: { name: "Duplicate" },
      });
      await createLabel(request1);

      // Try to create duplicate
      const request2 = createMockRequest("http://localhost:3000/api/labels", {
        method: "POST",
        body: { name: "duplicate" }, // Same name, different case
      });
      const response = await createLabel(request2);

      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data.error).toContain("already exists");
    });
  });
});