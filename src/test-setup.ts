/**
 * Global Test Setup
 * Configuration and utilities for all tests
 */

import { join } from "path";
import { existsSync, unlinkSync, mkdirSync } from "fs";

// Set test environment
(process.env as Record<string, string>).NODE_ENV = "test";
process.env.DATABASE_PATH = "./data/test.db";

/**
 * Clean up and recreate test database
 */
export function resetTestDatabase(): void {
  const testDbPath = join(process.cwd(), "data", "test.db");
  
  // Close any existing database connection first
  try {
    const { closeDatabase } = require("@/lib/db");
    closeDatabase();
  } catch {
    // Ignore errors if database wasn't connected
  }
  
  // Delete test database if it exists
  if (existsSync(testDbPath)) {
    try {
      unlinkSync(testDbPath);
    } catch (error) {
      console.warn("[Test Setup] Could not clean up test database:", error);
    }
  }
  
  // Ensure data directory exists
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Setup test database with migrations
 */
export function setupTestDatabase(): void {
  resetTestDatabase();
  
  // Run migrations to set up schema
  const { runMigrations } = require("@/lib/db/migrations");
  runMigrations();
}

/**
 * Clean up after tests
 */
export function cleanupTestDatabase(): void {
  try {
    const { closeDatabase } = require("@/lib/db");
    closeDatabase();
  } catch {
    // Ignore errors
  }
}

// Mock console methods during tests to reduce noise
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

export function silenceConsole(): void {
  console.log = () => {};
  console.info = () => {};
}

export function restoreConsole(): void {
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
}

// Global test utilities
export const testUtils = {
  resetTestDatabase,
  setupTestDatabase,
  cleanupTestDatabase,
  silenceConsole,
  restoreConsole,
};

// Export types for test factories
export interface TestListInput {
  name: string;
  color?: string;
  emoji?: string;
  sortOrder?: number;
}

export interface TestTaskInput {
  listId: number;
  name: string;
  description?: string | null;
  taskDate?: string | null;
  deadline?: string | null;
  priority?: "high" | "medium" | "low" | "none";
  isCompleted?: boolean;
  labelIds?: number[];
}

export interface TestLabelInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface TestSubtaskInput {
  taskId: number;
  name: string;
  isCompleted?: boolean;
  sortOrder?: number;
}