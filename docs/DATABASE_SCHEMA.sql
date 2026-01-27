-- Daily Task Planner - Database Schema
-- SQLite with foreign key support
-- Run: PRAGMA foreign_keys = ON;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Lists: Task containers (Inbox + custom lists)
-- ----------------------------------------------------------------------------
CREATE TABLE lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',  -- Default indigo-500
    emoji TEXT NOT NULL DEFAULT '📥',        -- Default inbox emoji
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_name_max_length CHECK (length(name) <= 100),
    CONSTRAINT chk_color_format CHECK (color REGEXP '^#[0-9a-fA-F]{6}$'),
    CONSTRAINT chk_emoji_single CHECK (length(emoji) <= 2)
);

-- Tasks: Main task entities
-- ----------------------------------------------------------------------------
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    task_date DATE,                          -- YYYY-MM-DD format
    deadline DATETIME,                       -- Full timestamp
    reminder DATETIME,                       -- When to remind user
    estimate TEXT CHECK (estimate REGEXP '^\d{2}:\d{2}$'),      -- HH:mm format
    actual_time TEXT CHECK (actual_time REGEXP '^\d{2}:\d{2}$'), -- HH:mm format
    priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('high', 'medium', 'low', 'none')),
    recurrence_rule TEXT,                    -- JSON object as text
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
-- ----------------------------------------------------------------------------
CREATE TABLE labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#8b5cf6',   -- Default violet-500
    icon TEXT NOT NULL DEFAULT 'tag',        -- Lucide icon name
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_label_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_label_name_max CHECK (length(name) <= 50),
    CONSTRAINT chk_label_color_format CHECK (color REGEXP '^#[0-9a-fA-F]{6}$')
);

-- Task Labels: Many-to-many relationship
-- ----------------------------------------------------------------------------
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
-- ----------------------------------------------------------------------------
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
-- ----------------------------------------------------------------------------
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,                 -- Relative to uploads directory
    file_size INTEGER NOT NULL,              -- Bytes
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
-- ----------------------------------------------------------------------------
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
    old_value TEXT,                          -- JSON or plain text
    new_value TEXT,                          -- JSON or plain text
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_activity_task 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Task filtering and sorting
CREATE INDEX idx_tasks_list_completed_date ON tasks(list_id, is_completed, task_date);
CREATE INDEX idx_tasks_date ON tasks(task_date) WHERE task_date IS NOT NULL;
CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_tasks_completed_updated ON tasks(is_completed, updated_at DESC);
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE priority != 'none';
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- Search optimization
CREATE INDEX idx_tasks_name ON tasks(name);
CREATE INDEX idx_tasks_description ON tasks(description) WHERE description IS NOT NULL;

-- Task labels relationship
CREATE INDEX idx_task_labels_task ON task_labels(task_id);
CREATE INDEX idx_task_labels_label ON task_labels(label_id);

-- Subtasks
CREATE INDEX idx_subtasks_task ON subtasks(task_id, sort_order);

-- Attachments
CREATE INDEX idx_attachments_task ON attachments(task_id);

-- Activity log timeline
CREATE INDEX idx_activity_task_created ON activity_logs(task_id, created_at DESC);
CREATE INDEX idx_activity_action ON activity_logs(action);

-- Lists ordering
CREATE INDEX idx_lists_sort_order ON lists(sort_order);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for lists
CREATE TRIGGER trigger_lists_updated_at
AFTER UPDATE ON lists
BEGIN
    UPDATE lists SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Auto-update updated_at timestamp for tasks
CREATE TRIGGER trigger_tasks_updated_at
AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Auto-set completed_at when task is marked complete
CREATE TRIGGER trigger_task_completed
AFTER UPDATE OF is_completed ON tasks
WHEN NEW.is_completed = 1 AND OLD.is_completed = 0
BEGIN
    UPDATE tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    INSERT INTO activity_logs (task_id, action, old_value, new_value)
    VALUES (NEW.id, 'completed', NULL, NULL);
END;

-- Auto-log when task is uncompleted
CREATE TRIGGER trigger_task_uncompleted
AFTER UPDATE OF is_completed ON tasks
WHEN NEW.is_completed = 0 AND OLD.is_completed = 1
BEGIN
    UPDATE tasks SET completed_at = NULL WHERE id = NEW.id;
    INSERT INTO activity_logs (task_id, action, old_value, new_value)
    VALUES (NEW.id, 'uncompleted', 'completed', 'uncompleted');
END;

-- Log task creation
CREATE TRIGGER trigger_task_created
AFTER INSERT ON tasks
BEGIN
    INSERT INTO activity_logs (task_id, action, old_value, new_value)
    VALUES (NEW.id, 'created', NULL, json_object('name', NEW.name, 'list_id', NEW.list_id));
END;

-- Log subtask completion
CREATE TRIGGER trigger_subtask_completed
AFTER UPDATE OF is_completed ON subtasks
WHEN NEW.is_completed = 1 AND OLD.is_completed = 0
BEGIN
    INSERT INTO activity_logs (task_id, action, old_value, new_value)
    VALUES (NEW.task_id, 'subtask_completed', OLD.name, NULL);
END;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Create default Inbox list (cannot be deleted)
INSERT INTO lists (id, name, color, emoji, sort_order) 
VALUES (1, 'Inbox', '#6366f1', '📥', 0);

-- Reset sequence so next list gets ID 2
-- Note: SQLite uses sqlite_sequence table for AUTOINCREMENT
-- This will be handled automatically by SQLite

-- ============================================================================
-- VIEWS (Optional - for complex queries)
-- ============================================================================

-- View: Task summary with label count and subtask stats
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

-- View: Today's tasks with all details
CREATE VIEW todays_tasks AS
SELECT * FROM task_summary
WHERE task_date = date('now')
   OR (task_date IS NULL AND is_completed = 0);

-- View: Upcoming tasks (next 7 days)
CREATE VIEW upcoming_tasks AS
SELECT * FROM task_summary
WHERE task_date > date('now') 
  AND task_date <= date('now', '+7 days')
  AND is_completed = 0
ORDER BY task_date, priority;

-- View: Overdue tasks
CREATE VIEW overdue_tasks AS
SELECT * FROM task_summary
WHERE task_date < date('now') 
  AND is_completed = 0
ORDER BY task_date;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Recurrence Rule JSON Structure:
-- {
--   "type": "daily" | "weekly" | "weekday" | "monthly" | "yearly" | "custom",
--   "interval": 1,              -- Every N periods (for custom)
--   "daysOfWeek": [0,1,2,3,4],  -- 0=Sunday, 6=Saturday (for weekly)
--   "dayOfMonth": 15,           -- 1-31 (for monthly)
--   "monthOfYear": 6,           -- 1-12 (for yearly)
--   "endDate": "2024-12-31",    -- ISO date or null
--   "occurrences": 10           -- Max occurrences or null
-- }

-- Activity Log Value Format:
-- - For 'updated': JSON object with changed fields
-- - For 'moved': { "old_list_id": 1, "new_list_id": 2 }
-- - For attachments: { "file_name": "doc.pdf", "file_size": 1024 }
-- - For subtasks: { "subtask_name": "Subtask 1" }

