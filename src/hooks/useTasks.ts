/**
 * useTasks Hook
 * React Query hooks for task management
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Task,
  TaskSummary,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilter,
  TaskView,
} from "@/lib/types";

interface TasksResponse {
  tasks: TaskSummary[];
  filter?: TaskFilter;
  view?: TaskView;
}

interface TaskDetailResponse {
  task: Task;
  summary: TaskSummary;
  labels: number[];
}

interface TaskMutationResponse {
  task: Task;
  summary?: TaskSummary;
  labels?: number[];
}

// Query keys for caching
const TASKS_KEY = ["tasks"] as const;
const TASK_KEY = (id: number) => ["tasks", id] as const;
const TASKS_BY_VIEW = (view: TaskView) => ["tasks", "view", view] as const;
const TASKS_BY_FILTER = (filter: TaskFilter) => ["tasks", "filter", JSON.stringify(filter)] as const;

/**
 * Fetch tasks by view
 */
async function fetchTasksByView(view: TaskView): Promise<TaskSummary[]> {
  const response = await fetch(`/api/tasks?view=${view}`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  const data: TasksResponse = await response.json();
  return data.tasks;
}

/**
 * Fetch tasks with filter
 */
async function fetchTasksWithFilter(filter: TaskFilter): Promise<TaskSummary[]> {
  const params = new URLSearchParams();

  if (filter.listId) params.append("listId", filter.listId.toString());
  if (filter.priority) params.append("priority", filter.priority);
  if (filter.isCompleted !== undefined) params.append("isCompleted", filter.isCompleted.toString());
  if (filter.taskDate) params.append("taskDate", filter.taskDate);
  if (filter.dateRange) {
    params.append("dateFrom", filter.dateRange.start);
    params.append("dateTo", filter.dateRange.end);
  }
  if (filter.labelIds) {
    filter.labelIds.forEach((id) => params.append("labelId", id.toString()));
  }

  const response = await fetch(`/api/tasks?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  const data: TasksResponse = await response.json();
  return data.tasks;
}

/**
 * Fetch a single task by ID
 */
async function fetchTask(id: number): Promise<TaskDetailResponse> {
  const response = await fetch(`/api/tasks/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch task");
  }
  const data: TaskDetailResponse = await response.json();
  return data;
}

/**
 * Create a new task
 */
async function createTask(input: CreateTaskInput): Promise<TaskMutationResponse> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create task");
  }
  const data: TaskMutationResponse = await response.json();
  return data;
}

/**
 * Update a task
 */
async function updateTask({
  id,
  input,
}: {
  id: number;
  input: UpdateTaskInput;
}): Promise<TaskMutationResponse> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update task");
  }
  const data: TaskMutationResponse = await response.json();
  return data;
}

/**
 * Delete a task
 */
async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete task");
  }
}

/**
 * Toggle task completion
 */
async function toggleTaskCompletion(id: number): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}/complete`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to toggle task completion");
  }
  const data: { task: Task } = await response.json();
  return data.task;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch tasks by view
 */
export function useTasksByView(view: TaskView) {
  return useQuery({
    queryKey: TASKS_BY_VIEW(view),
    queryFn: () => fetchTasksByView(view),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch tasks with filter
 */
export function useTasksWithFilter(filter: TaskFilter, enabled = true) {
  return useQuery({
    queryKey: TASKS_BY_FILTER(filter),
    queryFn: () => fetchTasksWithFilter(filter),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single task by ID
 */
export function useTask(id: number) {
  return useQuery({
    queryKey: TASK_KEY(id),
    queryFn: () => fetchTask(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new task with optimistic updates
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      // Invalidate all task queries
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      // Invalidate lists to update task counts
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      // Invalidate activity
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

/**
 * Hook to update a task with optimistic updates
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: TASK_KEY(id) });

      const previousTask = queryClient.getQueryData<TaskDetailResponse>(TASK_KEY(id));

      if (previousTask) {
        queryClient.setQueryData<TaskDetailResponse>(TASK_KEY(id), {
          ...previousTask,
          task: { ...previousTask.task, ...input, updatedAt: new Date().toISOString() },
        });
      }

      return { previousTask };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(TASK_KEY(id), context.previousTask);
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: TASK_KEY(id) });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

/**
 * Hook to delete a task with optimistic updates
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

/**
 * Hook to toggle task completion with optimistic updates
 */
export function useToggleTaskCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleTaskCompletion,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASK_KEY(id) });
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });

      const previousTask = queryClient.getQueryData<TaskDetailResponse>(TASK_KEY(id));
      const previousTasks = queryClient.getQueryData<TaskSummary[]>(TASKS_KEY);

      // Optimistically update task detail
      if (previousTask) {
        const newCompletedState = !previousTask.task.isCompleted;
        queryClient.setQueryData<TaskDetailResponse>(TASK_KEY(id), {
          ...previousTask,
          task: {
            ...previousTask.task,
            isCompleted: newCompletedState,
            completedAt: newCompletedState ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          },
        });
      }

      // Optimistically update task lists
      queryClient.setQueriesData<TaskSummary[]>({ queryKey: TASKS_KEY }, (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === id
            ? {
                ...task,
                isCompleted: !task.isCompleted,
              }
            : task
        );
      });

      return { previousTask, previousTasks };
    },
    onError: (_err, id, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(TASK_KEY(id), context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: TASK_KEY(id) });
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
