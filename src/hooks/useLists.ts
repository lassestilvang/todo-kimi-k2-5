/**
 * useLists Hook
 * React Query hooks for list management
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { List, CreateListInput, UpdateListInput } from "@/lib/types";

interface ListWithTaskCount extends List {
  taskCount: number;
}

interface ListsResponse {
  lists: ListWithTaskCount[];
}

interface ListResponse {
  list: List;
}

// Query keys for caching
const LISTS_KEY = ["lists"] as const;
const LIST_KEY = (id: number) => ["lists", id] as const;

/**
 * Fetch all lists with task counts
 */
async function fetchLists(): Promise<ListWithTaskCount[]> {
  const response = await fetch("/api/lists");
  if (!response.ok) {
    throw new Error("Failed to fetch lists");
  }
  const data: ListsResponse = await response.json();
  return data.lists;
}

/**
 * Fetch a single list by ID
 */
async function fetchList(id: number): Promise<List> {
  const response = await fetch(`/api/lists/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch list");
  }
  const data: ListResponse = await response.json();
  return data.list;
}

/**
 * Create a new list
 */
async function createList(input: CreateListInput): Promise<List> {
  const response = await fetch("/api/lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create list");
  }
  const data: ListResponse = await response.json();
  return data.list;
}

/**
 * Update a list
 */
async function updateList({
  id,
  input,
}: {
  id: number;
  input: UpdateListInput;
}): Promise<List> {
  const response = await fetch(`/api/lists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update list");
  }
  const data: ListResponse = await response.json();
  return data.list;
}

/**
 * Delete a list
 */
async function deleteList(id: number): Promise<void> {
  const response = await fetch(`/api/lists/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete list");
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all lists with task counts
 */
export function useLists() {
  return useQuery({
    queryKey: LISTS_KEY,
    queryFn: fetchLists,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single list by ID
 */
export function useList(id: number) {
  return useQuery({
    queryKey: LIST_KEY(id),
    queryFn: () => fetchList(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to create a new list with optimistic updates
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createList,
    onMutate: async (newList) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: LISTS_KEY });

      // Snapshot previous value
      const previousLists = queryClient.getQueryData<ListWithTaskCount[]>(LISTS_KEY);

      // Optimistically update
      const optimisticList: ListWithTaskCount = {
        id: Date.now(), // Temporary ID
        name: newList.name,
        color: newList.color || "#3b82f6",
        emoji: newList.emoji || "📋",
        sortOrder: newList.sortOrder || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        taskCount: 0,
      };

      queryClient.setQueryData<ListWithTaskCount[]>(LISTS_KEY, (old) => {
        return old ? [...old, optimisticList] : [optimisticList];
      });

      return { previousLists };
    },
    onError: (_err, _newList, context) => {
      // Rollback on error
      if (context?.previousLists) {
        queryClient.setQueryData(LISTS_KEY, context.previousLists);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

/**
 * Hook to update a list with optimistic updates
 */
export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateList,
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: LISTS_KEY });
      await queryClient.cancelQueries({ queryKey: LIST_KEY(id) });

      const previousLists = queryClient.getQueryData<ListWithTaskCount[]>(LISTS_KEY);
      const previousList = queryClient.getQueryData<List>(LIST_KEY(id));

      // Optimistically update lists
      queryClient.setQueryData<ListWithTaskCount[]>(LISTS_KEY, (old) => {
        if (!old) return old;
        return old.map((list) =>
          list.id === id ? { ...list, ...input, updatedAt: new Date().toISOString() } : list
        );
      });

      // Optimistically update single list
      if (previousList) {
        queryClient.setQueryData<List>(LIST_KEY(id), {
          ...previousList,
          ...input,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousLists, previousList };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(LISTS_KEY, context.previousLists);
      }
      if (context?.previousList) {
        queryClient.setQueryData(LIST_KEY(id), context.previousList);
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: LISTS_KEY });
      queryClient.invalidateQueries({ queryKey: LIST_KEY(id) });
    },
  });
}

/**
 * Hook to delete a list with optimistic updates
 */
export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteList,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LISTS_KEY });

      const previousLists = queryClient.getQueryData<ListWithTaskCount[]>(LISTS_KEY);

      queryClient.setQueryData<ListWithTaskCount[]>(LISTS_KEY, (old) => {
        if (!old) return old;
        return old.filter((list) => list.id !== id);
      });

      return { previousLists };
    },
    onError: (_err, _id, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(LISTS_KEY, context.previousLists);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}
