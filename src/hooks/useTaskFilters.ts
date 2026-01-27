/**
 * useTaskFilters Hook
 * Hook for managing task filter state
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type { TaskFilter, TaskView, Priority } from "@/lib/types";

interface UseTaskFiltersOptions {
  initialView?: TaskView;
  initialListId?: number;
  initialLabelIds?: number[];
  initialPriority?: Priority;
  initialShowCompleted?: boolean;
}

interface TaskFiltersState extends TaskFilter {
  view: TaskView;
  showCompleted: boolean;
}

/**
 * Hook for managing task filter state
 * Combines view selection, list filtering, label filtering, and more
 */
export function useTaskFilters(options: UseTaskFiltersOptions = {}) {
  const {
    initialView = "today",
    initialListId,
    initialLabelIds = [],
    initialPriority,
    initialShowCompleted = false,
  } = options;

  // View state
  const [view, setView] = useState<TaskView>(initialView);

  // Filter states
  const [listId, setListId] = useState<number | undefined>(initialListId);
  const [labelIds, setLabelIds] = useState<number[]>(initialLabelIds);
  const [priority, setPriority] = useState<Priority | undefined>(initialPriority);
  const [showCompleted, setShowCompleted] = useState<boolean>(initialShowCompleted);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Computed filter object for API calls
  const filter = useMemo<TaskFilter>(() => {
    const filterObj: TaskFilter = {};

    if (listId) {
      filterObj.listId = listId;
    }

    if (labelIds.length > 0) {
      filterObj.labelIds = labelIds;
    }

    if (priority) {
      filterObj.priority = priority;
    }

    if (!showCompleted) {
      filterObj.isCompleted = false;
    }

    if (searchQuery) {
      filterObj.searchQuery = searchQuery;
    }

    // Add date range based on view
    if (view === "today") {
      const today = new Date().toISOString().split("T")[0];
      filterObj.taskDate = today;
    } else if (view === "next7") {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      filterObj.dateRange = {
        start: today.toISOString().split("T")[0],
        end: nextWeek.toISOString().split("T")[0],
      };
    } else if (view === "upcoming") {
      const today = new Date();
      filterObj.dateRange = {
        start: today.toISOString().split("T")[0],
        end: "2099-12-31", // Far future
      };
    }

    return filterObj;
  }, [listId, labelIds, priority, showCompleted, searchQuery, view]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      !!listId ||
      labelIds.length > 0 ||
      !!priority ||
      !!searchQuery ||
      showCompleted
    );
  }, [listId, labelIds, priority, searchQuery, showCompleted]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setListId(undefined);
    setLabelIds([]);
    setPriority(undefined);
    setShowCompleted(false);
    setSearchQuery("");
  }, []);

  // Toggle label selection
  const toggleLabel = useCallback((labelId: number) => {
    setLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  }, []);

  // Clear label selection
  const clearLabels = useCallback(() => {
    setLabelIds([]);
  }, []);

  // Set view and reset conflicting filters
  const setViewWithReset = useCallback(
    (newView: TaskView) => {
      setView(newView);
      // Clear list-specific filter when switching to a view
      if (newView !== "all" && listId) {
        setListId(undefined);
      }
    },
    [listId]
  );

  // Select a specific list (switches to "all" view)
  const selectList = useCallback((id: number | undefined) => {
    setListId(id);
    if (id) {
      setView("all");
    }
  }, []);

  return {
    // View state
    view,
    setView: setViewWithReset,

    // Filter states
    listId,
    setListId: selectList,
    labelIds,
    setLabelIds,
    priority,
    setPriority,
    showCompleted,
    setShowCompleted,
    searchQuery,
    setSearchQuery,

    // Computed
    filter,
    hasActiveFilters,

    // Actions
    resetFilters,
    toggleLabel,
    clearLabels,
  };
}

/**
 * Get view title and icon
 */
export function getViewInfo(view: TaskView): { title: string; icon: string } {
  const viewInfo: Record<TaskView, { title: string; icon: string }> = {
    today: { title: "Today", icon: "sun" },
    next7: { title: "Next 7 Days", icon: "calendar-days" },
    upcoming: { title: "Upcoming", icon: "calendar" },
    all: { title: "All Tasks", icon: "inbox" },
    completed: { title: "Completed", icon: "check-circle" },
  };

  return viewInfo[view];
}

/**
 * Get view description
 */
export function getViewDescription(view: TaskView): string {
  const descriptions: Record<TaskView, string> = {
    today: "Tasks scheduled for today",
    next7: "Tasks due in the next 7 days",
    upcoming: "All upcoming tasks",
    all: "All your tasks",
    completed: "Completed tasks",
  };

  return descriptions[view];
}
