/**
 * CreateTaskDialog Component
 * Quick task creation modal
 */

"use client";

import * as React from "react";
import { Plus, X, Calendar, Flag, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/forms/DatePicker";
import { PriorityButtonGroup } from "@/components/forms/PrioritySelect";
import type { CreateTaskInputType } from "@/lib/validation/schemas";
import type { List as ListType, Priority } from "@/lib/types";

export interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskInputType) => void;
  lists: ListType[];
  defaultListId?: number;
  isSubmitting?: boolean;
  className?: string;
}

export function CreateTaskDialog({
  isOpen,
  onClose,
  onSubmit,
  lists,
  defaultListId,
  isSubmitting = false,
  className,
}: CreateTaskDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [listId, setListId] = React.useState<number>(
    defaultListId || lists[0]?.id || 0
  );
  const [taskDate, setTaskDate] = React.useState<string | undefined>(undefined);
  const [priority, setPriority] = React.useState<Priority>("none");
  const [showMore, setShowMore] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setListId(defaultListId || lists[0]?.id || 0);
      setTaskDate(undefined);
      setPriority("none");
      setShowMore(false);
    }
  }, [isOpen, defaultListId, lists]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      listId,
      taskDate: taskDate || null,
      priority,
    });
  };

  const isValid = name.trim().length > 0;

  // Handle Cmd/Ctrl + Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isValid) {
      handleSubmit(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn("sm:max-w-lg", className)}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your list. Press Cmd+Enter to quickly save.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="text-lg"
            />
          </div>

          {/* Description (collapsible) */}
          {showMore && (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          )}

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* List Selector */}
            <Select
              value={listId.toString()}
              onValueChange={(v) => setListId(parseInt(v))}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <List className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id.toString()}>
                    <span className="flex items-center gap-1.5">
                      <span>{list.emoji}</span>
                      <span className="truncate">{list.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Picker */}
            <DatePicker
              value={taskDate}
              onChange={setTaskDate}
              placeholder="Set date"
              className="h-8 text-xs w-32"
            />

            {/* Priority */}
            <div className="flex items-center gap-1 border rounded-md p-0.5">
              {(["high", "medium", "low", "none"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "h-6 w-6 rounded flex items-center justify-center text-xs transition-colors",
                    priority === p
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-muted-foreground"
                  )}
                  title={`Priority: ${p}`}
                >
                  <Flag
                    className="h-3 w-3"
                    fill={p !== "none" ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>

            {/* Show More Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMore(!showMore)}
              className="h-8 text-xs"
            >
              {showMore ? "Less" : "More"}
            </Button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
