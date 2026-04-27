/**
 * TaskItem Component
 * Individual task row with checkbox, name, meta badges
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TaskCheckbox } from "./TaskCheckbox";
import { TaskMeta } from "./TaskMeta";
import { PriorityIcon } from "./PriorityBadge";
import type { TaskSummary, Label, Priority } from "@/lib/types";

export interface TaskItemProps {
  task: TaskSummary;
  labels?: Label[];
  isSelected?: boolean;
  isCompact?: boolean;
  onClick?: () => void;
  onComplete?: (completed: boolean) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

export const TaskItem = React.memo(function TaskItem({
  task,
  labels,
  isSelected = false,
  isCompact = false,
  onClick,
  onComplete,
  onContextMenu,
  className,
}: TaskItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking the checkbox
    if ((e.target as HTMLElement).closest("[role='checkbox']")) {
      return;
    }
    onClick?.();
  };

  const handleCheckboxChange = (checked: boolean) => {
    onComplete?.(checked);
  };

  const taskLabels = labels?.filter((label) =>
    // Note: TaskSummary doesn't have labelIds directly, this would need to be fetched
    // For now, we assume labels are passed directly
    true
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        "hover:bg-accent/50",
        isSelected && "border-primary/50 bg-accent",
        task.isCompleted && "opacity-60",
        className
      )}
      role="listitem"
      aria-selected={isSelected}
    >
      {/* Checkbox */}
      <div className="pt-0.5">
        <TaskCheckbox
          checked={task.isCompleted}
          onChange={handleCheckboxChange}
          size={isCompact ? "sm" : "md"}
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Name and Priority */}
        <div className="flex items-start gap-2">
          <PriorityIcon
            priority={task.priority}
            className="mt-1 shrink-0"
          />
          <span
            className={cn(
              "flex-1 truncate text-sm font-medium leading-relaxed",
              task.isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.name}
          </span>
        </div>

        {/* Meta info */}
        {!isCompact && (
          <TaskMeta
            dueDate={task.taskDate}
            priority={task.priority}
            subtaskCount={{
              completed: task.completedSubtasks,
              total: task.totalSubtasks,
            }}
            attachmentCount={task.attachmentCount}
            labels={taskLabels}
            size="sm"
          />
        )}
      </div>

      {/* List indicator (optional) */}
      {!isCompact && (
        <div
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: task.listColor }}
          title={task.listName}
        />
      )}
    </motion.div>
  );
});

// Compact variant for subtasks or inline lists
export function TaskItemCompact({
  task,
  onClick,
  onComplete,
  className,
}: {
  task: TaskSummary;
  onClick?: () => void;
  onComplete?: (completed: boolean) => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md p-2 hover:bg-accent/50",
        task.isCompleted && "opacity-60",
        className
      )}
    >
      <TaskCheckbox
        checked={task.isCompleted}
        onChange={onComplete || (() => {})}
        size="sm"
      />
      <span
        className={cn(
          "flex-1 text-sm",
          task.isCompleted && "line-through text-muted-foreground"
        )}
      >
        {task.name}
      </span>
      <PriorityIcon priority={task.priority} className="shrink-0" />
    </div>
  );
}

// Skeleton loader for tasks
export function TaskItemSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border p-3"
        >
          <div className="h-5 w-5 shrink-0 rounded-md bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
