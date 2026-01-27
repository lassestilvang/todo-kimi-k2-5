/**
 * useLabels Hook
 * React Query hooks for label management
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Label, CreateLabelInput, UpdateLabelInput } from "@/lib/types";

interface LabelWithTaskCount extends Label {
  taskCount: number;
}

interface LabelsResponse {
  labels: LabelWithTaskCount[];
}

interface LabelResponse {
  label: Label;
}

// Query keys for caching
const LABELS_KEY = ["labels"] as const;
const LABEL_KEY = (id: number) => ["labels", id] as const;

/**
 * Fetch all labels with task counts
 */
async function fetchLabels(): Promise<LabelWithTaskCount[]> {
  const response = await fetch("/api/labels");
  if (!response.ok) {
    throw new Error("Failed to fetch labels");
  }
  const data: LabelsResponse = await response.json();
  return data.labels;
}

/**
 * Fetch a single label by ID
 */
async function fetchLabel(id: number): Promise<Label> {
  const response = await fetch(`/api/labels/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch label");
  }
  const data: LabelResponse = await response.json();
  return data.label;
}

/**
 * Create a new label
 */
async function createLabel(input: CreateLabelInput): Promise<Label> {
  const response = await fetch("/api/labels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create label");
  }
  const data: LabelResponse = await response.json();
  return data.label;
}

/**
 * Update a label
 */
async function updateLabel({
  id,
  input,
}: {
  id: number;
  input: UpdateLabelInput;
}): Promise<Label> {
  const response = await fetch(`/api/labels/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update label");
  }
  const data: LabelResponse = await response.json();
  return data.label;
}

/**
 * Delete a label
 */
async function deleteLabel(id: number): Promise<void> {
  const response = await fetch(`/api/labels/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete label");
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all labels with task counts
 */
export function useLabels() {
  return useQuery({
    queryKey: LABELS_KEY,
    queryFn: fetchLabels,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single label by ID
 */
export function useLabel(id: number) {
  return useQuery({
    queryKey: LABEL_KEY(id),
    queryFn: () => fetchLabel(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to create a new label with optimistic updates
 */
export function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLabel,
    onMutate: async (newLabel) => {
      await queryClient.cancelQueries({ queryKey: LABELS_KEY });

      const previousLabels = queryClient.getQueryData<LabelWithTaskCount[]>(LABELS_KEY);

      const optimisticLabel: LabelWithTaskCount = {
        id: Date.now(), // Temporary ID
        name: newLabel.name,
        color: newLabel.color || "#3b82f6",
        icon: newLabel.icon || "tag",
        createdAt: new Date().toISOString(),
        taskCount: 0,
      };

      queryClient.setQueryData<LabelWithTaskCount[]>(LABELS_KEY, (old) => {
        return old ? [...old, optimisticLabel] : [optimisticLabel];
      });

      return { previousLabels };
    },
    onError: (_err, _newLabel, context) => {
      if (context?.previousLabels) {
        queryClient.setQueryData(LABELS_KEY, context.previousLabels);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LABELS_KEY });
    },
  });
}

/**
 * Hook to update a label with optimistic updates
 */
export function useUpdateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLabel,
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: LABELS_KEY });
      await queryClient.cancelQueries({ queryKey: LABEL_KEY(id) });

      const previousLabels = queryClient.getQueryData<LabelWithTaskCount[]>(LABELS_KEY);
      const previousLabel = queryClient.getQueryData<Label>(LABEL_KEY(id));

      queryClient.setQueryData<LabelWithTaskCount[]>(LABELS_KEY, (old) => {
        if (!old) return old;
        return old.map((label) =>
          label.id === id ? { ...label, ...input } : label
        );
      });

      if (previousLabel) {
        queryClient.setQueryData<Label>(LABEL_KEY(id), {
          ...previousLabel,
          ...input,
        });
      }

      return { previousLabels, previousLabel };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousLabels) {
        queryClient.setQueryData(LABELS_KEY, context.previousLabels);
      }
      if (context?.previousLabel) {
        queryClient.setQueryData(LABEL_KEY(id), context.previousLabel);
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: LABELS_KEY });
      queryClient.invalidateQueries({ queryKey: LABEL_KEY(id) });
    },
  });
}

/**
 * Hook to delete a label with optimistic updates
 */
export function useDeleteLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLabel,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LABELS_KEY });

      const previousLabels = queryClient.getQueryData<LabelWithTaskCount[]>(LABELS_KEY);

      queryClient.setQueryData<LabelWithTaskCount[]>(LABELS_KEY, (old) => {
        if (!old) return old;
        return old.filter((label) => label.id !== id);
      });

      return { previousLabels };
    },
    onError: (_err, _id, context) => {
      if (context?.previousLabels) {
        queryClient.setQueryData(LABELS_KEY, context.previousLabels);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LABELS_KEY });
      // Also invalidate tasks since they may have had this label
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
