/**
 * useSubtasks Hook
 * React Query hooks for subtask management
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Subtask, CreateSubtaskInput, UpdateSubtaskInput } from "@/lib/types";

interface SubtasksResponse {
  subtasks: Subtask[];
  taskId: number;
}

interface SubtaskResponse {
  subtask: Subtask;
}

// Query keys for caching
const SUBTASKS_KEY = (taskId: number) => ["subtasks", taskId] as const;
const SUBTASK_KEY = (id: number) => ["subtasks", "item", id] as const;

/**
 * Fetch all subtasks for a task
 */
async function fetchSubtasks(taskId: number): Promise<Subtask[]> {
  const response = await fetch(`/api/tasks/${taskId}/subtasks`);
  if (!response.ok) {
    throw new Error("Failed to fetch subtasks");
  }
  const data: SubtasksResponse = await response.json();
  return data.subtasks;
}

/**
 * Fetch a single subtask by ID
 */
async function fetchSubtask(id: number): Promise<Subtask> {
  const response = await fetch(`/api/subtasks/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch subtask");
  }
  const data: SubtaskResponse = await response.json();
  return data.subtask;
}

/**
 * Create a new subtask
 */
async function createSubtask({
  taskId,
  input,
}: {
  taskId: number;
  input: Omit<CreateSubtaskInput, "taskId">;
}): Promise<Subtask> {
  const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create subtask");
  }
  const data: SubtaskResponse = await response.json();
  return data.subtask;
}

/**
 * Update a subtask
 */
async function updateSubtask({
  id,
  input,
}: {
  id: number;
  input: UpdateSubtaskInput;
}): Promise<Subtask> {
  const response = await fetch(`/api/subtasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update subtask");
  }
  const data: SubtaskResponse = await response.json();
  return data.subtask;
}

/**
 * Delete a subtask
 */
async function deleteSubtask(id: number): Promise<void> {
  const response = await fetch(`/api/subtasks/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete subtask");
  }
}

/**
 * Toggle subtask completion
 */
async function toggleSubtaskCompletion(id: number): Promise<Subtask> {
  const response = await fetch(`/api/subtasks/${id}/toggle`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to toggle subtask completion");
  }
  const data: SubtaskResponse = await response.json();
  return data.subtask;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all subtasks for a task
 */
export function useSubtasks(taskId: number) {
  return useQuery({
    queryKey: SUBTASKS_KEY(taskId),
    queryFn: () => fetchSubtasks(taskId),
    enabled: !!taskId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single subtask by ID
 */
export function useSubtask(id: number) {
  return useQuery({
    queryKey: SUBTASK_KEY(id),
    queryFn: () => fetchSubtask(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new subtask with optimistic updates
 */
export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubtask,
    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey: SUBTASKS_KEY(taskId) });

      const previousSubtasks = queryClient.getQueryData<Subtask[]>(SUBTASKS_KEY(taskId));

      const optimisticSubtask: Subtask = {
        id: Date.now(), // Temporary ID
        taskId,
        name: input.name,
        isCompleted: false,
        sortOrder: input.sortOrder ?? 0,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Subtask[]>(SUBTASKS_KEY(taskId), (old) => {
        return old ? [...old, optimisticSubtask] : [optimisticSubtask];
      });

      return { previousSubtasks };
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(SUBTASKS_KEY(taskId), context.previousSubtasks);
      }
    },
    onSettled: (_data, _error, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: SUBTASKS_KEY(taskId) });
      // Invalidate task to update subtask count
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/**
 * Hook to update a subtask with optimistic updates
 */
export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubtask,
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: SUBTASK_KEY(id) });

      // Find which task this subtask belongs to
      const queryCache = queryClient.getQueryCache();
      const subtaskQueries = queryCache.findAll({ queryKey: ["subtasks"] });
      let taskId: number | undefined;

      for (const query of subtaskQueries) {
        const data = query.state.data as Subtask[] | undefined;
        if (data?.some((s) => s.id === id)) {
          taskId = (query.queryKey[1] as number);
          break;
        }
      }

      if (taskId) {
        await queryClient.cancelQueries({ queryKey: SUBTASKS_KEY(taskId) });
      }

      const previousSubtask = queryClient.getQueryData<Subtask>(SUBTASK_KEY(id));

      if (previousSubtask) {
        queryClient.setQueryData<Subtask>(SUBTASK_KEY(id), {
          ...previousSubtask,
          ...input,
        });

        // Also update in the list
        if (taskId) {
          queryClient.setQueryData<Subtask[]>(SUBTASKS_KEY(taskId), (old) => {
            if (!old) return old;
            return old.map((s) => (s.id === id ? { ...s, ...input } : s));
          });
        }
      }

      return { previousSubtask, taskId };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousSubtask) {
        queryClient.setQueryData(SUBTASK_KEY(id), context.previousSubtask);
      }
      if (context?.taskId) {
        queryClient.invalidateQueries({ queryKey: SUBTASKS_KEY(context.taskId) });
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: SUBTASK_KEY(id) });
    },
  });
}

/**
 * Hook to delete a subtask with optimistic updates
 */
export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubtask,
    onMutate: async (id) => {
      // Find which task this subtask belongs to
      const queryCache = queryClient.getQueryCache();
      const subtaskQueries = queryCache.findAll({ queryKey: ["subtasks"] });
      let taskId: number | undefined;

      for (const query of subtaskQueries) {
        const data = query.state.data as Subtask[] | undefined;
        if (data?.some((s) => s.id === id)) {
          taskId = (query.queryKey[1] as number);
          break;
        }
      }

      if (taskId) {
        await queryClient.cancelQueries({ queryKey: SUBTASKS_KEY(taskId) });

        const previousSubtasks = queryClient.getQueryData<Subtask[]>(SUBTASKS_KEY(taskId));

        queryClient.setQueryData<Subtask[]>(SUBTASKS_KEY(taskId), (old) => {
          if (!old) return old;
          return old.filter((s) => s.id !== id);
        });

        return { previousSubtasks, taskId };
      }

      return { taskId };
    },
    onError: (_err, _id, context) => {
      if (context?.taskId && context?.previousSubtasks) {
        queryClient.setQueryData(SUBTASKS_KEY(context.taskId), context.previousSubtasks);
      }
    },
    onSettled: (_data, _error, _id, context) => {
      if (context?.taskId) {
        queryClient.invalidateQueries({ queryKey: SUBTASKS_KEY(context.taskId) });
        queryClient.invalidateQueries({ queryKey: ["tasks", context.taskId] });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/**
 * Hook to toggle subtask completion with optimistic updates
 */
export function useToggleSubtaskCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleSubtaskCompletion,
    onMutate: async (id) => {
      // Find which task this subtask belongs to
      const queryCache = queryClient.getQueryCache();
      const subtaskQueries = queryCache.findAll({ queryKey: ["subtasks"] });
      let taskId: number | undefined;

      for (const query of subtaskQueries) {
        const data = query.state.data as Subtask[] | undefined;
        if (data?.some((s) => s.id === id)) {
          taskId = (query.queryKey[1] as number);
          break;
        }
      }

      if (taskId) {
        await queryClient.cancelQueries({ queryKey: SUBTASKS_KEY(taskId) });
      }

      const previousSubtask = queryClient.getQueryData<Subtask>(SUBTASK_KEY(id));

      if (previousSubtask) {
        const newCompletedState = !previousSubtask.isCompleted;
        const updatedSubtask = {
          ...previousSubtask,
          isCompleted: newCompletedState,
        };

        queryClient.setQueryData<Subtask>(SUBTASK_KEY(id), updatedSubtask);

        if (taskId) {
          queryClient.setQueryData<Subtask[]>(SUBTASKS_KEY(taskId), (old) => {
            if (!old) return old;
            return old.map((s) => (s.id === id ? updatedSubtask : s));
          });
        }
      }

      return { previousSubtask, taskId };
    },
    onError: (_err, id, context) => {
      if (context?.previousSubtask) {
        queryClient.setQueryData(SUBTASK_KEY(id), context.previousSubtask);
      }
      if (context?.taskId) {
        queryClient.invalidateQueries({ queryKey: SUBTASKS_KEY(context.taskId) });
      }
    },
    onSettled: (_data, _error, id, context) => {
      queryClient.invalidateQueries({ queryKey: SUBTASK_KEY(id) });
      if (context?.taskId) {
        queryClient.invalidateQueries({ queryKey: SUBTASKS_KEY(context.taskId) });
        queryClient.invalidateQueries({ queryKey: ["tasks", context.taskId] });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
