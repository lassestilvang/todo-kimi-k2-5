/**
 * SubtaskList Component
 * Nested subtasks with add/toggle/edit/delete
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  GripVertical,
  Trash2,
  MoreHorizontal,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskCheckboxCircle } from "./TaskCheckbox";
import type { Subtask } from "@/lib/types";

export interface SubtaskListProps {
  subtasks: Subtask[];
  onAdd: (name: string) => void;
  onToggle: (subtaskId: number, completed: boolean) => void;
  onEdit: (subtaskId: number, name: string) => void;
  onDelete: (subtaskId: number) => void;
  onReorder?: (subtaskIds: number[]) => void;
  isLoading?: boolean;
  className?: string;
}

export function SubtaskList({
  subtasks,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  isLoading = false,
  className,
}: SubtaskListProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newSubtaskName, setNewSubtaskName] = React.useState("");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sort subtasks by sortOrder
  const sortedSubtasks = React.useMemo(() => {
    return [...subtasks].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [subtasks]);

  const completedCount = sortedSubtasks.filter((s) => s.isCompleted).length;
  const progress =
    sortedSubtasks.length > 0
      ? Math.round((completedCount / sortedSubtasks.length) * 100)
      : 0;

  const handleAdd = () => {
    if (newSubtaskName.trim()) {
      onAdd(newSubtaskName.trim());
      setNewSubtaskName("");
      setIsAdding(false);
    }
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingName(subtask.name);
    // Focus will happen after render
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onEdit(editingId, editingName.trim());
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isAdding) {
        handleAdd();
      } else if (editingId) {
        handleSaveEdit();
      }
    } else if (e.key === "Escape") {
      if (isAdding) {
        setIsAdding(false);
        setNewSubtaskName("");
      } else if (editingId) {
        handleCancelEdit();
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with progress */}
      {sortedSubtasks.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Subtasks</span>
              <span className="text-muted-foreground">
                {completedCount}/{sortedSubtasks.length}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary transition-all"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {sortedSubtasks.map((subtask, index) => (
            <motion.div
              key={subtask.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              {editingId === subtask.id ? (
                <div className="flex items-center gap-2 p-2">
                  <Input
                    ref={inputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 h-8"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSaveEdit}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <SubtaskItem
                  subtask={subtask}
                  onToggle={(completed) => onToggle(subtask.id, completed)}
                  onEdit={() => handleStartEdit(subtask)}
                  onDelete={() => onDelete(subtask.id)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add subtask input */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-2"
            >
              <TaskCheckboxCircle
                checked={false}
                onChange={() => {}}
                size="sm"
              />
              <Input
                ref={inputRef}
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a subtask..."
                className="flex-1 h-8"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleAdd}
                disabled={!newSubtaskName.trim()}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setIsAdding(false);
                  setNewSubtaskName("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add button */}
      {!isAdding && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => {
            setIsAdding(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add subtask
        </Button>
      )}
    </div>
  );
}

// Individual subtask item
interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (completed: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SubtaskItem({
  subtask,
  onToggle,
  onEdit,
  onDelete,
}: SubtaskItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md p-2 hover:bg-accent/50 transition-colors",
        subtask.isCompleted && "opacity-60"
      )}
    >
      <TaskCheckboxCircle
        checked={subtask.isCompleted}
        onChange={onToggle}
        size="sm"
      />

      <span
        className={cn(
          "flex-1 text-sm",
          subtask.isCompleted && "line-through text-muted-foreground"
        )}
      >
        {subtask.name}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Skeleton loader for subtasks
export function SubtaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">Subtasks</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <div className="h-4 w-4 rounded-full bg-muted" />
          <div className="h-4 flex-1 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
