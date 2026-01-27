/**
 * Test Setup File
 * Preloaded before all tests
 */

import { join } from "path";
import { existsSync, unlinkSync, mkdirSync } from "fs";

// Set test database path
process.env.DATABASE_PATH = "./data/test.db";

// Clean up test database before tests
const testDbPath = join(process.cwd(), "data", "test.db");
if (existsSync(testDbPath)) {
  try {
    unlinkSync(testDbPath);
    console.log("[Test Setup] Cleaned up existing test database");
  } catch (error) {
    console.warn("[Test Setup] Could not clean up test database:", error);
  }
}

// Ensure data directory exists
const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

console.log("[Test Setup] Test environment initialized");
