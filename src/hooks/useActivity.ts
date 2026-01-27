/**
 * useActivity Hook
 * React Query hooks for activity log management
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityLog, ActivityAction } from "@/lib/types";

interface ActivityResponse {
  activity: ActivityLog[];
  limit?: number;
  dateRange?: { from: string; to: string };
}

interface ActivityStats {
  totalTasks: number;
  completedTasks: number;
  createdToday: number;
  completedToday: number;
  completionRate: number;
  streakDays: number;
}

interface StatsResponse {
  stats: ActivityStats;
}

// Query keys for caching
const ACTIVITY_KEY = ["activity"] as const;
const TASK_ACTIVITY_KEY = (taskId: number) => ["activity", "task", taskId] as const;
const ACTIVITY_STATS_KEY = ["activity", "stats"] as const;

/**
 * Fetch recent activity
 */
async function fetchActivity(limit = 50): Promise<ActivityLog[]> {
  const response = await fetch(`/api/activity?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch activity");
  }
  const data: ActivityResponse = await response.json();
  return data.activity;
}

/**
 * Fetch activity for a specific task
 */
async function fetchTaskActivity(taskId: number): Promise<ActivityLog[]> {
  const response = await fetch(`/api/tasks/${taskId}/activity`);
  if (!response.ok) {
    throw new Error("Failed to fetch task activity");
  }
  const data: { activity: ActivityLog[] } = await response.json();
  return data.activity;
}

/**
 * Fetch activity within a date range
 */
async function fetchActivityByDateRange(
  from: string,
  to: string
): Promise<ActivityLog[]> {
  const response = await fetch(
    `/api/activity?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch activity by date range");
  }
  const data: ActivityResponse = await response.json();
  return data.activity;
}

/**
 * Fetch activity stats
 */
async function fetchActivityStats(): Promise<ActivityStats> {
  const response = await fetch("/api/activity?stats=true");
  if (!response.ok) {
    throw new Error("Failed to fetch activity stats");
  }
  const data: StatsResponse = await response.json();
  return data.stats;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch recent activity
 */
export function useActivity(limit = 50) {
  return useQuery({
    queryKey: [...ACTIVITY_KEY, limit],
    queryFn: () => fetchActivity(limit),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch activity for a specific task
 */
export function useTaskActivity(taskId: number) {
  return useQuery({
    queryKey: TASK_ACTIVITY_KEY(taskId),
    queryFn: () => fetchTaskActivity(taskId),
    enabled: !!taskId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch activity within a date range
 */
export function useActivityByDateRange(from: string, to: string) {
  return useQuery({
    queryKey: [...ACTIVITY_KEY, "range", from, to],
    queryFn: () => fetchActivityByDateRange(from, to),
    enabled: !!from && !!to,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch activity stats
 */
export function useActivityStats() {
  return useQuery({
    queryKey: ACTIVITY_STATS_KEY,
    queryFn: fetchActivityStats,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format activity action for display
 */
export function formatActivityAction(action: ActivityAction): string {
  const actionMap: Record<ActivityAction, string> = {
    created: "created",
    updated: "updated",
    completed: "completed",
    uncompleted: "marked as incomplete",
    moved: "moved",
    deleted: "deleted",
    attachment_added: "added an attachment to",
    attachment_removed: "removed an attachment from",
    subtask_added: "added a subtask to",
    subtask_completed: "completed a subtask in",
    reminder_triggered: "reminder triggered for",
  };

  return actionMap[action] || action;
}

/**
 * Get icon name for activity action
 */
export function getActivityActionIcon(action: ActivityAction): string {
  const iconMap: Record<ActivityAction, string> = {
    created: "plus",
    updated: "pencil",
    completed: "check-circle",
    uncompleted: "x-circle",
    moved: "arrow-right",
    deleted: "trash",
    attachment_added: "paperclip",
    attachment_removed: "unlink",
    subtask_added: "list-plus",
    subtask_completed: "check-square",
    reminder_triggered: "bell",
  };

  return iconMap[action] || "activity";
}

/**
 * Format activity timestamp for display
 */
export function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
