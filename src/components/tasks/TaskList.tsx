/**
 * TaskList Component
 * Virtualized/scrolled list of tasks with grouping
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { TaskItem, TaskItemSkeleton } from "./TaskItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { TaskSummary, Label, Priority } from "@/lib/types";

export type TaskGroupBy = "date" | "list" | "priority" | "none";
export type TaskSortBy = "date" | "priority" | "created" | "manual";

export interface TaskListProps {
  tasks: TaskSummary[];
  labels?: Label[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onTaskClick?: (taskId: number) => void;
  onTaskComplete?: (taskId: number, completed: boolean) => void;
  selectedTaskId?: number | null;
  sortBy?: TaskSortBy;
  groupBy?: TaskGroupBy;
  showCompleted?: boolean;
  className?: string;
}

interface TaskGroup {
  id: string;
  title: string;
  count: number;
  tasks: TaskSummary[];
  isCollapsible?: boolean;
}

export function TaskList({
  tasks,
  labels,
  isLoading = false,
  emptyState,
  onTaskClick,
  onTaskComplete,
  selectedTaskId,
  sortBy = "date",
  groupBy = "date",
  showCompleted = true,
  className,
}: TaskListProps) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    new Set()
  );

  // Filter completed tasks if needed
  const filteredTasks = React.useMemo(() => {
    if (showCompleted) return tasks;
    return tasks.filter((t) => !t.isCompleted);
  }, [tasks, showCompleted]);

  // Sort tasks
  const sortedTasks = React.useMemo(() => {
    const sorted = [...filteredTasks];
    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => {
          // Tasks without dates go to bottom
          if (!a.taskDate && !b.taskDate) return 0;
          if (!a.taskDate) return 1;
          if (!b.taskDate) return -1;
          return a.taskDate.localeCompare(b.taskDate);
        });
      case "priority":
        const priorityOrder: Record<Priority, number> = {
          high: 0,
          medium: 1,
          low: 2,
          none: 3,
        };
        return sorted.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
      case "created":
        // Most recent first (would need createdAt in TaskSummary)
        return sorted;
      default:
        return sorted;
    }
  }, [filteredTasks, sortBy]);

  // Group tasks
  const groups = React.useMemo((): TaskGroup[] => {
    if (groupBy === "none") {
      return [
        {
          id: "all",
          title: "All Tasks",
          count: sortedTasks.length,
          tasks: sortedTasks,
          isCollapsible: false,
        },
      ];
    }

    const grouped = new Map<string, TaskGroup>();

    sortedTasks.forEach((task) => {
      let groupKey: string;
      let groupTitle: string;

      switch (groupBy) {
        case "date":
          if (!task.taskDate) {
            groupKey = "no-date";
            groupTitle = "No Date";
          } else {
            const date = parseISO(task.taskDate);
            const isOverdue = isPast(date) && !isToday(date);

            if (isOverdue) {
              groupKey = "overdue";
              groupTitle = "Overdue";
            } else if (isToday(date)) {
              groupKey = "today";
              groupTitle = "Today";
            } else if (isTomorrow(date)) {
              groupKey = "tomorrow";
              groupTitle = "Tomorrow";
            } else {
              groupKey = task.taskDate;
              groupTitle = format(date, "EEEE, MMMM d");
            }
          }
          break;

        case "list":
          groupKey = `list-${task.listId}`;
          groupTitle = task.listName;
          break;

        case "priority":
          const priorityLabels: Record<Priority, string> = {
            high: "High Priority",
            medium: "Medium Priority",
            low: "Low Priority",
            none: "No Priority",
          };
          groupKey = `priority-${task.priority}`;
          groupTitle = priorityLabels[task.priority];
          break;

        default:
          groupKey = "all";
          groupTitle = "All Tasks";
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: groupKey,
          title: groupTitle,
          count: 0,
          tasks: [],
          isCollapsible: true,
        });
      }

      const group = grouped.get(groupKey)!;
      group.tasks.push(task);
      group.count++;
    });

    // Sort groups for date view
    if (groupBy === "date") {
      const groupOrder = ["overdue", "today", "tomorrow"];
      return Array.from(grouped.values()).sort((a, b) => {
        const aIndex = groupOrder.indexOf(a.id);
        const bIndex = groupOrder.indexOf(b.id);

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        // Sort remaining by date
        return a.id.localeCompare(b.id);
      });
    }

    return Array.from(grouped.values());
  }, [sortedTasks, groupBy]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (isLoading) {
    return <TaskItemSkeleton count={5} className={className} />;
  }

  if (tasks.length === 0) {
    return (
      <div className={className}>
        {emptyState || <TaskEmptyState />}
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4 pr-4">
        <AnimatePresence mode="popLayout">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* Group Header */}
              {group.isCollapsible ? (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-2 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  {collapsedGroups.has(group.id) ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span>{group.title}</span>
                  <span className="ml-1 text-xs">({group.count})</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 py-2 text-sm font-semibold text-muted-foreground">
                  <span>{group.title}</span>
                  <span className="text-xs">({group.count})</span>
                </div>
              )}

              {/* Group Tasks */}
              <AnimatePresence>
                {!collapsedGroups.has(group.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    {group.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        labels={labels}
                        isSelected={selectedTaskId === task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        onComplete={(completed) =>
                          onTaskComplete?.(task.id, completed)
                        }
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}

// Empty state component
export function TaskEmptyState({
  title = "No tasks yet",
  description = "Create your first task to get started",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Task group for manual composition
export interface TaskGroupProps {
  title: string;
  count: number;
  tasks: TaskSummary[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}

export function TaskGroup({
  title,
  count,
  isCollapsed = false,
  onToggle,
  children,
}: TaskGroupProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        <span>{title}</span>
        <span className="ml-1 text-xs">({count})</span>
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
