/**
 * useSearch Hook
 * React Query hook for fuzzy search with debounce
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import type { TaskSummary, Label } from "@/lib/types";

// Re-export TaskView type for useTaskFilters
export type { TaskView } from "@/lib/types";

interface SearchResultTask extends TaskSummary {
  score?: number;
}

interface SearchResultLabel extends Label {
  score?: number;
}

interface GlobalSearchResponse {
  tasks: SearchResultTask[];
  labels: SearchResultLabel[];
  query: string;
  type: "global";
  totalResults: number;
}

interface TasksSearchResponse {
  tasks: SearchResultTask[];
  scores: number[];
  query: string;
  type: "tasks";
}

interface LabelsSearchResponse {
  labels: SearchResultLabel[];
  scores: number[];
  query: string;
  type: "labels";
}

interface QuickSearchResponse {
  tasks: TaskSummary[];
  query: string;
  type: "quick";
}

interface SuggestionsResponse {
  suggestions: string[];
  query: string;
  type: "suggestions";
}

type SearchResponse =
  | GlobalSearchResponse
  | TasksSearchResponse
  | LabelsSearchResponse
  | QuickSearchResponse
  | SuggestionsResponse;

interface SearchFilters {
  listId?: number;
  priority?: string;
  isCompleted?: boolean;
  dateFrom?: string;
  dateTo?: string;
  labelIds?: number[];
}

// Query key for search
const SEARCH_KEY = (query: string, type?: string) => ["search", query, type] as const;

/**
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Perform global search
 */
async function performSearch(
  query: string,
  limit = 20
): Promise<GlobalSearchResponse> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error("Failed to perform search");
  }
  const data: GlobalSearchResponse = await response.json();
  return data;
}

/**
 * Search tasks only
 */
async function searchTasks(
  query: string,
  limit = 20
): Promise<TasksSearchResponse> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&type=tasks&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error("Failed to search tasks");
  }
  const data: TasksSearchResponse = await response.json();
  return data;
}

/**
 * Search labels only
 */
async function searchLabels(
  query: string,
  limit = 20
): Promise<LabelsSearchResponse> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&type=labels&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error("Failed to search labels");
  }
  const data: LabelsSearchResponse = await response.json();
  return data;
}

/**
 * Quick search for tasks
 */
async function quickSearch(
  query: string,
  limit = 10
): Promise<QuickSearchResponse> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&type=quick&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error("Failed to perform quick search");
  }
  const data: QuickSearchResponse = await response.json();
  return data;
}

/**
 * Get search suggestions
 */
async function getSuggestions(
  query: string,
  limit = 5
): Promise<SuggestionsResponse> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&type=suggestions&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error("Failed to get suggestions");
  }
  const data: SuggestionsResponse = await response.json();
  return data;
}

/**
 * Advanced search with filters
 */
async function advancedSearch(
  query: string,
  filters: SearchFilters,
  limit = 20
): Promise<{ tasks: TaskSummary[]; query: string; type: "advanced" }> {
  const params = new URLSearchParams();
  params.append("q", query);
  params.append("limit", limit.toString());

  if (filters.listId) params.append("listId", filters.listId.toString());
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.isCompleted !== undefined)
    params.append("isCompleted", filters.isCompleted.toString());
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);
  if (filters.labelIds) {
    filters.labelIds.forEach((id) => params.append("labelId", id.toString()));
  }

  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to perform advanced search");
  }
  const data = await response.json();
  return data;
}

// ============================================================================
// HOOKS
// ============================================================================

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook for global search with debounce
 */
export function useSearch(
  query: string,
  options: UseSearchOptions = {}
) {
  const { debounceMs = 300, limit = 20, enabled = true } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: SEARCH_KEY(debouncedQuery, "global"),
    queryFn: () => performSearch(debouncedQuery, limit),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for searching tasks only with debounce
 */
export function useTaskSearch(
  query: string,
  options: UseSearchOptions = {}
) {
  const { debounceMs = 300, limit = 20, enabled = true } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: SEARCH_KEY(debouncedQuery, "tasks"),
    queryFn: () => searchTasks(debouncedQuery, limit),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for searching labels only with debounce
 */
export function useLabelSearch(
  query: string,
  options: UseSearchOptions = {}
) {
  const { debounceMs = 300, limit = 20, enabled = true } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: SEARCH_KEY(debouncedQuery, "labels"),
    queryFn: () => searchLabels(debouncedQuery, limit),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for quick search with debounce
 */
export function useQuickSearch(
  query: string,
  options: UseSearchOptions = {}
) {
  const { debounceMs = 150, limit = 10, enabled = true } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: SEARCH_KEY(debouncedQuery, "quick"),
    queryFn: () => quickSearch(debouncedQuery, limit),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for search suggestions with debounce
 */
export function useSearchSuggestions(
  query: string,
  options: UseSearchOptions = {}
) {
  const { debounceMs = 200, limit = 5, enabled = true } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: SEARCH_KEY(debouncedQuery, "suggestions"),
    queryFn: () => getSuggestions(debouncedQuery, limit),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for advanced search with filters and debounce
 */
export function useAdvancedSearch(
  query: string,
  filters: SearchFilters,
  options: UseSearchOptions = {}
) {
  const { debounceMs = 300, limit = 20, enabled = true } = options;
  const debouncedQuery = useDebounce(query, debounceMs);

  return useQuery({
    queryKey: [...SEARCH_KEY(debouncedQuery, "advanced"), filters],
    queryFn: () => advancedSearch(debouncedQuery, filters, limit),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to manage search input state with debounce
 */
export function useSearchInput(initialValue = "", debounceMs = 300) {
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, debounceMs);

  const clearSearch = useCallback(() => {
    setQuery("");
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    clearSearch,
  };
}
