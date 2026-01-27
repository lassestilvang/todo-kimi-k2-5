/**
 * Database Connection Module
 * Uses better-sqlite3 for Node.js runtime (Next.js dev/build)
 * Falls back to bun:sqlite when running in Bun
 */

import { join } from "path";
import { mkdirSync, existsSync } from "fs";

// Type definitions
interface Database {
  exec(sql: string): void;
  query(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown | undefined;
    run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number };
  };
  close(): void;
}

// Database configuration
const DB_PATH = process.env.DATABASE_PATH || "./data/app.db";

let db: Database | null = null;

/**
 * Check if running in Bun runtime
 */
function isBun(): boolean {
  return typeof process !== "undefined" && process.versions && "bun" in process.versions;
}

/**
 * Create database instance based on runtime
 */
function createDatabase(dbPath: string): Database {
  if (isBun()) {
    // Use bun:sqlite in Bun runtime
    const { Database: BunDatabase } = require("bun:sqlite");
    const database = new BunDatabase(dbPath);
    
    // Enable foreign keys
    database.exec("PRAGMA foreign_keys = ON");
    database.exec("PRAGMA journal_mode = WAL");
    database.exec("PRAGMA synchronous = NORMAL");
    
    return database as Database;
  } else {
    // Use better-sqlite3 in Node.js runtime
    const BetterSQLite3 = require("better-sqlite3");
    const database = new BetterSQLite3(dbPath);
    
    // Enable foreign keys
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = NORMAL");
    
    // Wrap better-sqlite3 to match bun:sqlite interface
    return {
      exec: (sql: string) => database.exec(sql),
      query: (sql: string) => {
        const stmt = database.prepare(sql);
        return {
          all: (...params: unknown[]) => stmt.all(...params),
          get: (...params: unknown[]) => stmt.get(...params),
          run: (...params: unknown[]) => stmt.run(...params),
        };
      },
      close: () => database.close(),
    };
  }
}

/**
 * Get the database instance (singleton pattern)
 * Creates the database if it doesn't exist
 */
export function getDatabase(): Database {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Open database connection
  const dbPath = DB_PATH.startsWith("./") 
    ? join(process.cwd(), DB_PATH.slice(2)) 
    : DB_PATH;

  db = createDatabase(dbPath);
  
  console.log(`[Database] Connected to ${dbPath} (${isBun() ? "Bun" : "Node.js"} runtime)`);
  
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log("[Database] Connection closed");
  }
}

/**
 * Check if database connection is active
 */
export function isDatabaseConnected(): boolean {
  return db !== null;
}

/**
 * Execute a query and return all results
 */
export function query<T = unknown>(sql: string, params?: (string | number | null)[]): T[] {
  const database = getDatabase();
  const stmt = database.query(sql);
  return params ? (stmt.all(...params) as T[]) : (stmt.all() as T[]);
}

/**
 * Execute a query and return a single result
 */
export function queryOne<T = unknown>(sql: string, params?: (string | number | null)[]): T | null {
  const database = getDatabase();
  const stmt = database.query(sql);
  const result = params ? stmt.get(...params) : stmt.get();
  return (result as T) || null;
}

/**
 * Execute a run statement (INSERT, UPDATE, DELETE)
 * Returns the last inserted ID and changes count
 */
export function run(sql: string, params?: (string | number | null)[]): { lastInsertRowid: number | bigint; changes: number } {
  const database = getDatabase();
  const stmt = database.query(sql);
  return params ? stmt.run(...params) : stmt.run();
}

/**
 * Execute a transaction with multiple statements
 */
export function transaction<T>(fn: (db: Database) => T): T {
  const database = getDatabase();
  database.exec("BEGIN TRANSACTION");
  try {
    const result = fn(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

/**
 * Test database connection
 */
export function testConnection(): boolean {
  try {
    const database = getDatabase();
    const result = database.query("SELECT 1 as test").get() as { test: number };
    return result.test === 1;
  } catch (error) {
    console.error("[Database] Connection test failed:", error);
    return false;
  }
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): {
  tables: number;
  indexes: number;
  size: number;
} {
  const database = getDatabase();
  
  const tableCount = database.query(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table'"
  ).get() as { count: number };
  
  const indexCount = database.query(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'index'"
  ).get() as { count: number };
  
  const dbPath = DB_PATH.startsWith("./") 
    ? join(process.cwd(), DB_PATH.slice(2)) 
    : DB_PATH;
  
  const stats = {
    tables: tableCount.count,
    indexes: indexCount.count,
    size: 0,
  };
  
  try {
    const { statSync } = require("fs");
    stats.size = statSync(dbPath).size;
  } catch {
    // File might not exist yet
  }
  
  return stats;
}

// Export types
export type { Database };
