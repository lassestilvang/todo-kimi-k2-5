/**
 * Database Migration Runner
 * Executes schema and seed data
 */

import { getDatabase, queryOne } from "./index";

/**
 * Embedded schema that's compatible with both better-sqlite3 and bun:sqlite
 * (No REGEXP function support)
 */
const COMPATIBLE_SCHEMA = `
-- Daily Task Planner - Database Schema (compatible version)
-- SQLite with foreign key support

-- ============================================================================
-- TABLES
-- ============================================================================

-- Lists: Task containers (Inbox + custom lists)
CREATE TABLE lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    emoji TEXT NOT NULL DEFAULT '📥',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_name_max_length CHECK (length(name) <= 100),
    CONSTRAINT chk_emoji_single CHECK (length(emoji) <= 2)
);

-- Tasks: Main task entities
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    task_date DATE,
    deadline DATETIME,
    reminder DATETIME,
    estimate TEXT,
    actual_time TEXT,
    priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('high', 'medium', 'low', 'none')),
    recurrence_rule TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_task_list 
        FOREIGN KEY (list_id) 
        REFERENCES lists(id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_name_max_length CHECK (length(name) <= 500),
    CONSTRAINT chk_deadline_after_created CHECK (deadline IS NULL OR deadline >= created_at),
    CONSTRAINT chk_completed_at_required CHECK (is_completed = 0 OR completed_at IS NOT NULL)
);

-- Labels: Categorical tags with icons
CREATE TABLE labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#8b5cf6',
    icon TEXT NOT NULL DEFAULT 'tag',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_label_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_label_name_max CHECK (length(name) <= 50)
);

-- Task Labels: Many-to-many relationship
CREATE TABLE task_labels (
    task_id INTEGER NOT NULL,
    label_id INTEGER NOT NULL,
    
    PRIMARY KEY (task_id, label_id),
    
    CONSTRAINT fk_task_label_task 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_task_label_label 
        FOREIGN KEY (label_id) 
        REFERENCES labels(id) 
        ON DELETE CASCADE
);

-- Subtasks: Nested checkable items
CREATE TABLE subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_subtask_task 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_subtask_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_subtask_name_max CHECK (length(name) <= 500)
);

-- Attachments: File references
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_attachment_task 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_file_name_not_empty CHECK (length(trim(file_name)) > 0),
    CONSTRAINT chk_file_size_positive CHECK (file_size > 0),
    CONSTRAINT chk_mime_type_not_empty CHECK (length(trim(mime_type)) > 0)
);

-- Activity Logs: Audit trail for task changes
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'created',
        'updated',
        'completed',
        'uncompleted',
        'moved',
        'deleted',
        'attachment_added',
        'attachment_removed',
        'subtask_added',
        'subtask_completed',
        'reminder_triggered'
    )),
    old_value TEXT,
    new_value TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_activity_task 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_tasks_list_completed_date ON tasks(list_id, is_completed, task_date);
CREATE INDEX idx_tasks_date ON tasks(task_date) WHERE task_date IS NOT NULL;
CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_tasks_completed_updated ON tasks(is_completed, updated_at DESC);
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE priority != 'none';
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

CREATE INDEX idx_tasks_name ON tasks(name);
CREATE INDEX idx_tasks_description ON tasks(description) WHERE description IS NOT NULL;

CREATE INDEX idx_task_labels_task ON task_labels(task_id);
CREATE INDEX idx_task_labels_label ON task_labels(label_id);

CREATE INDEX idx_subtasks_task ON subtasks(task_id, sort_order);

CREATE INDEX idx_attachments_task ON attachments(task_id);

CREATE INDEX idx_activity_task_created ON activity_logs(task_id, created_at DESC);
CREATE INDEX idx_activity_action ON activity_logs(action);

CREATE INDEX idx_lists_sort_order ON lists(sort_order);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_lists_updated_at
AFTER UPDATE ON lists
BEGIN
    UPDATE lists SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_tasks_updated_at
AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_task_completed
AFTER UPDATE OF is_completed ON tasks
WHEN NEW.is_completed = 1 AND OLD.is_completed = 0
BEGIN
    UPDATE tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    INSERT INTO activity_logs (task_id, action, old_value, new_value)
    VALUES (NEW.id, 'completed', NULL, NULL);
END;

CREATE TRIGGER trigger_task_uncompleted
AFTER UPDATE OF is_completed ON tasks
WHEN NEW.is_completed = 0 AND OLD.is_completed = 1
BEGIN
    UPDATE tasks SET completed_at = NULL WHERE id = NEW.id;
    INSERT INTO activity_logs (task_id, action, old_value, new_value)
    VALUES (NEW.id, 'uncompleted', 'completed', 'uncompleted');
END;

CREATE TRIGGER trigger_task_created
AFTER INSERT ON tasks
BEGIN
    INSERT INTO activity_logs (task_id, action, old_value, new_value)
    VALUES (NEW.id, 'created', NULL, json_object('name', NEW.name, 'list_id', NEW.list_id));
END;

CREATE TRIGGER trigger_subtask_completed
AFTER UPDATE OF is_completed ON subtasks
WHEN NEW.is_completed = 1 AND OLD.is_completed = 0
BEGIN
    INSERT INTO activity_logs (task_id, action, old_value, new_value)
    VALUES (NEW.task_id, 'subtask_completed', OLD.name, NULL);
END;

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW task_summary AS
SELECT 
    t.id,
    t.name,
    t.is_completed,
    t.priority,
    t.task_date,
    t.deadline,
    t.list_id,
    l.name as list_name,
    l.color as list_color,
    (SELECT COUNT(*) FROM task_labels tl WHERE tl.task_id = t.id) as label_count,
    (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id) as total_subtasks,
    (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.is_completed = 1) as completed_subtasks,
    (SELECT COUNT(*) FROM attachments a WHERE a.task_id = t.id) as attachment_count
FROM tasks t
JOIN lists l ON t.list_id = l.id;

CREATE VIEW todays_tasks AS
SELECT * FROM task_summary
WHERE task_date = date('now')
   OR (task_date IS NULL AND is_completed = 0);

CREATE VIEW upcoming_tasks AS
SELECT * FROM task_summary
WHERE task_date > date('now') 
  AND task_date <= date('now', '+7 days')
  AND is_completed = 0
ORDER BY task_date, priority;

CREATE VIEW overdue_tasks AS
SELECT * FROM task_summary
WHERE task_date < date('now') 
  AND is_completed = 0
ORDER BY task_date;
`;

/**
 * Check if migrations have already been run
 */
function isMigrated(): boolean {
  try {
    const result = queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = 'lists'"
    );
    return result?.count === 1;
  } catch {
    return false;
  }
}

/**
 * Check if the Inbox list exists
 */
function hasDefaultData(): boolean {
  try {
    const result = queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM lists WHERE id = 1"
    );
    return result?.count === 1;
  } catch {
    return false;
  }
}

/**
 * Run all database migrations
 */
export function runMigrations(): void {
  console.log("[Migrations] Starting database migrations...");

  // Check if already migrated
  if (isMigrated()) {
    console.log("[Migrations] Database already initialized, checking default data...");
    
    if (!hasDefaultData()) {
      console.log("[Migrations] Inserting default data...");
      insertDefaultData();
    }
    
    console.log("[Migrations] Migrations complete (already up to date)");
    return;
  }

  const db = getDatabase();

  // Execute entire schema in a transaction
  db.exec("BEGIN TRANSACTION");

  try {
    // Execute schema
    db.exec(COMPATIBLE_SCHEMA);
    
    console.log("[Migrations] Schema created successfully");

    db.exec("COMMIT");

    // Insert default data
    insertDefaultData();

    console.log("[Migrations] Migrations completed successfully");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("[Migrations] Migration failed:", error);
    throw error;
  }
}

/**
 * Insert default data (Inbox list)
 */
function insertDefaultData(): void {
  const db = getDatabase();

  try {
    // Check if Inbox already exists
    const existing = queryOne<{ id: number }>("SELECT id FROM lists WHERE id = 1");
    if (existing) {
      console.log("[Migrations] Default Inbox list already exists");
      return;
    }

    // Insert default Inbox list
    db.exec(`
      INSERT OR IGNORE INTO lists (id, name, color, emoji, sort_order) 
      VALUES (1, 'Inbox', '#6366f1', '📥', 0);
    `);

    console.log("[Migrations] Default Inbox list created");
  } catch (error) {
    console.error("[Migrations] Failed to insert default data:", error);
    throw error;
  }
}

/**
 * Reset database (drop all tables and re-run migrations)
 * WARNING: This will delete all data!
 */
export function resetDatabase(): void {
  console.log("[Migrations] Resetting database...");

  const db = getDatabase();

  // Get all tables
  const tables = db.query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  ).all() as { name: string }[];

  // Drop all tables
  db.exec("BEGIN TRANSACTION");

  try {
    for (const { name } of tables) {
      db.exec(`DROP TABLE IF EXISTS ${name}`);
      console.log(`[Migrations] Dropped table: ${name}`);
    }

    db.exec("COMMIT");
    console.log("[Migrations] All tables dropped");

    // Re-run migrations
    runMigrations();
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("[Migrations] Reset failed:", error);
    throw error;
  }
}

/**
 * Get migration status
 */
export function getMigrationStatus(): {
  isMigrated: boolean;
  hasDefaultData: boolean;
  tables: string[];
} {
  const db = getDatabase();

  const tables = db.query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all() as { name: string }[];

  return {
    isMigrated: isMigrated(),
    hasDefaultData: hasDefaultData(),
    tables: tables.map((t) => t.name),
  };
}

/**
 * Verify database tables were created correctly
 */
export function verifyTables(): { table: string; exists: boolean }[] {
  const expectedTables = [
    "lists",
    "tasks",
    "labels",
    "task_labels",
    "subtasks",
    "attachments",
    "activity_logs",
  ];

  return expectedTables.map((table) => ({
    table,
    exists:
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = ?",
        [table]
      )?.count === 1,
  }));
}
