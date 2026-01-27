/**
 * TaskDetail Component
 * Split panel for viewing/editing task details
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  MoreHorizontal,
  Calendar,
  Clock,
  Flag,
  Repeat,
  Paperclip,
  Activity,
  ListTodo,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { TaskCheckbox } from "./TaskCheckbox";
import { TaskMeta } from "./TaskMeta";
import { SubtaskList } from "./SubtaskList";
import { ActivityLog } from "./ActivityLog";
import { PriorityBadge } from "./PriorityBadge";
import { ConfirmDialog } from "../lists/ConfirmDialog";
import type { Task, List, Label, UpdateTaskInput, ActivityLog as ActivityLogType } from "@/lib/types";

export interface TaskDetailProps {
  task: Task | null;
  labels?: Label[];
  activities?: ActivityLogType[];
  subtasks?: { id: number; name: string; isCompleted: boolean; sortOrder: number; createdAt: string; taskId: number }[];
  isLoading?: boolean;
  isEditing?: boolean;
  onSave?: (task: UpdateTaskInput) => void;
  onDelete?: (taskId: number) => void;
  onClose?: () => void;
  onComplete?: (completed: boolean) => void;
  onSubtaskAdd?: (name: string) => void;
  onSubtaskToggle?: (subtaskId: number, completed: boolean) => void;
  onSubtaskEdit?: (subtaskId: number, name: string) => void;
  onSubtaskDelete?: (subtaskId: number) => void;
  className?: string;
}

export function TaskDetail({
  task,
  labels = [],
  activities = [],
  subtasks = [],
  isLoading = false,
  isEditing = false,
  onSave,
  onDelete,
  onClose,
  onComplete,
  onSubtaskAdd,
  onSubtaskToggle,
  onSubtaskEdit,
  onSubtaskDelete,
  className,
}: TaskDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [localDescription, setLocalDescription] = React.useState(
    task?.description || ""
  );

  // Update local description when task changes
  React.useEffect(() => {
    if (task) {
      setLocalDescription(task.description || "");
    }
  }, [task?.id, task?.description]);

  const handleDescriptionBlur = () => {
    if (task && localDescription !== task.description) {
      onSave?.({ description: localDescription || null });
    }
  };

  const handleDelete = () => {
    if (task) {
      onDelete?.(task.id);
      setShowDeleteConfirm(false);
    }
  };

  if (!task) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center p-8 text-center",
          className
        )}
      >
        <div className="rounded-full bg-muted p-4">
          <ListTodo className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Select a task</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Click on a task to view its details
        </p>
      </div>
    );
  }

  const taskLabels = labels.filter((label) =>
    // This would need to be passed from parent with task-label associations
    true
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={cn(
          "flex h-full flex-col border-l bg-card",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <TaskCheckbox
              checked={task.isCompleted}
              onChange={onComplete || (() => {})}
              size="md"
              isLoading={isLoading}
            />
            <span
              className={cn(
                "text-sm font-medium",
                task.isCompleted && "line-through text-muted-foreground"
              )}
            >
              {task.isCompleted ? "Completed" : "In Progress"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onComplete?.(!task.isCompleted)}
                >
                  {task.isCompleted ? "Mark incomplete" : "Mark complete"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4">
            {/* Task Name */}
            <div>
              <h2
                className={cn(
                  "text-xl font-semibold",
                  task.isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.name}
              </h2>

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={task.priority} size="sm" />
                {task.taskDate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(task.taskDate), "MMM d, yyyy")}
                  </span>
                )}
                {task.estimate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {task.estimate}
                  </span>
                )}
                {task.recurrenceRule && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <Repeat className="h-3 w-3" />
                    {task.recurrenceRule.frequency}
                  </span>
                )}
              </div>
            </div>

            {/* Labels */}
            {taskLabels.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Labels
                </h3>
                <div className="flex flex-wrap gap-1">
                  {taskLabels.map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Description
              </h3>
              <Textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add a description..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <Separator />

            {/* Subtasks */}
            {onSubtaskAdd && onSubtaskToggle && onSubtaskEdit && onSubtaskDelete && (
              <div>
                <SubtaskList
                  subtasks={subtasks}
                  onAdd={onSubtaskAdd}
                  onToggle={onSubtaskToggle}
                  onEdit={onSubtaskEdit}
                  onDelete={onSubtaskDelete}
                />
              </div>
            )}

            <Separator />

            {/* Activity */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4" />
                Activity
              </h3>
              <ActivityLog activities={activities} />
            </div>

            {/* Footer info */}
            <div className="text-xs text-muted-foreground">
              <p>Created {format(new Date(task.createdAt), "PPp")}</p>
              {task.completedAt && (
                <p>Completed {format(new Date(task.completedAt), "PPp")}</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </motion.div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
      />
    </>
  );
}

// Loading skeleton
export function TaskDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full flex-col border-l bg-card", className)}>
      <div className="flex items-center justify-between border-b p-4">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="h-8 w-8 rounded bg-muted" />
      </div>
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <div className="h-6 w-3/4 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded bg-muted" />
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-24 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
