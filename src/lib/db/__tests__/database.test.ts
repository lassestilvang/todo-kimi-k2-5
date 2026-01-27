/**
 * Database Connection and Migration Tests
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  getDatabase,
  closeDatabase,
  testConnection,
  isDatabaseConnected,
  query,
  queryOne,
  run,
  getDatabaseStats,
} from "../index";
import {
  runMigrations,
  getMigrationStatus,
  verifyTables,
} from "../migrations";

describe("Database Connection", () => {
  test("should connect to database", () => {
    const db = getDatabase();
    expect(db).toBeDefined();
    expect(isDatabaseConnected()).toBe(true);
  });

  test("should pass connection test", () => {
    expect(testConnection()).toBe(true);
  });

  test("should return database stats", () => {
    const stats = getDatabaseStats();
    expect(stats).toHaveProperty("tables");
    expect(stats).toHaveProperty("indexes");
    expect(typeof stats.tables).toBe("number");
    expect(typeof stats.indexes).toBe("number");
  });
});

describe("Database Migrations", () => {
  beforeAll(() => {
    // Run migrations before tests
    runMigrations();
  });

  test("should have migration status", () => {
    const status = getMigrationStatus();
    expect(status.isMigrated).toBe(true);
    expect(status.hasDefaultData).toBe(true);
    expect(Array.isArray(status.tables)).toBe(true);
  });

  test("should have all required tables", () => {
    const tables = verifyTables();
    
    expect(tables).toHaveLength(7);
    
    // Check each required table exists
    const requiredTables = [
      "lists",
      "tasks",
      "labels",
      "task_labels",
      "subtasks",
      "attachments",
      "activity_logs",
    ];

    for (const tableName of requiredTables) {
      const tableCheck = tables.find((t) => t.table === tableName);
      expect(tableCheck).toBeDefined();
      expect(tableCheck?.exists).toBe(true);
    }
  });

  test("should have default Inbox list", () => {
    const inbox = queryOne<{ id: number; name: string; emoji: string }>(
      "SELECT id, name, emoji FROM lists WHERE id = 1"
    );
    expect(inbox).toBeDefined();
    expect(inbox?.name).toBe("Inbox");
    expect(inbox?.emoji).toBe("📥");
  });
});

describe("Database Operations", () => {
  test("should execute a simple query", () => {
    const result = query<{ test: number }>("SELECT 1 as test");
    expect(result).toHaveLength(1);
    expect(result[0].test).toBe(1);
  });

  test("should execute a parameterized query", () => {
    const result = queryOne<{ value: string }>(
      "SELECT ? as value",
      ["test_value"]
    );
    expect(result?.value).toBe("test_value");
  });

  test("should insert and retrieve data", () => {
    // Insert a test list
    const insertResult = run(
      "INSERT INTO lists (name, color, emoji, sort_order) VALUES (?, ?, ?, ?)",
      ["Test List", "#ff0000", "📝", 1]
    );
    
    expect(insertResult.changes).toBe(1);
    expect(typeof insertResult.lastInsertRowid).toBe("number");

    // Retrieve the inserted list
    const list = queryOne<{ id: number; name: string }>(
      "SELECT id, name FROM lists WHERE name = ?",
      ["Test List"]
    );
    
    expect(list).toBeDefined();
    expect(list?.name).toBe("Test List");

    // Clean up
    run("DELETE FROM lists WHERE name = ?", ["Test List"]);
  });

  test("should enforce foreign key constraints", () => {
    // Try to insert a task with a non-existent list_id
    expect(() => {
      run(
        "INSERT INTO tasks (list_id, name) VALUES (?, ?)",
        [99999, "Test Task"]
      );
    }).toThrow();
  });
});

describe("Database Views", () => {
  test("should have task_summary view", () => {
    const view = queryOne<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'view' AND name = 'task_summary'"
    );
    expect(view).toBeDefined();
  });

  test("should have todays_tasks view", () => {
    const view = queryOne<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'view' AND name = 'todays_tasks'"
    );
    expect(view).toBeDefined();
  });

  test("should have upcoming_tasks view", () => {
    const view = queryOne<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'view' AND name = 'upcoming_tasks'"
    );
    expect(view).toBeDefined();
  });

  test("should have overdue_tasks view", () => {
    const view = queryOne<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'view' AND name = 'overdue_tasks'"
    );
    expect(view).toBeDefined();
  });
});

// Cleanup after all tests
describe("Cleanup", () => {
  test("should close database connection", () => {
    closeDatabase();
    expect(isDatabaseConnected()).toBe(false);
  });
});
