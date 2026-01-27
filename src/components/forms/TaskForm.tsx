/**
 * TaskForm Component
 * Main task creation/editing form with all fields
 */

"use client";

import * as React from "react";
import { Calendar, Clock, Flag, List, Tag, Repeat, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { PrioritySelect } from "./PrioritySelect";
import { LabelPicker } from "./LabelPicker";
import { RecurrencePicker } from "./RecurrencePicker";
import type { CreateTaskInputType, UpdateTaskInputType } from "@/lib/validation/schemas";
import type { Task, List as ListType, Label as LabelType, Priority, RecurrenceRule } from "@/lib/types";

export interface TaskFormProps {
  task?: Partial<Task>;
  lists: ListType[];
  labels: LabelType[];
  defaultListId?: number;
  onSubmit: (data: CreateTaskInputType | UpdateTaskInputType) => void;
  onCancel?: () => void;
  onCreateLabel?: (name: string) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function TaskForm({
  task,
  lists,
  labels,
  defaultListId,
  onSubmit,
  onCancel,
  onCreateLabel,
  isSubmitting = false,
  className,
}: TaskFormProps) {
  const isEditing = !!task?.id;

  // Form state
  const [name, setName] = React.useState(task?.name || "");
  const [description, setDescription] = React.useState(task?.description || "");
  const [listId, setListId] = React.useState<number>(
    task?.listId || defaultListId || lists[0]?.id || 0
  );
  const [taskDate, setTaskDate] = React.useState<string | undefined>(
    task?.taskDate || undefined
  );
  const [deadline, setDeadline] = React.useState<string | undefined>(
    task?.deadline || undefined
  );
  const [estimate, setEstimate] = React.useState<string | undefined>(
    task?.estimate || undefined
  );
  const [priority, setPriority] = React.useState<Priority>(
    task?.priority || "none"
  );
  const [recurrenceRule, setRecurrenceRule] = React.useState<
    RecurrenceRule | undefined
  >(task?.recurrenceRule || undefined);
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<number[]>(
    // This would come from the task-label association
    []
  );

  // Validation
  const isValid = name.trim().length > 0 && name.trim().length <= 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      listId,
      taskDate: taskDate || null,
      deadline: deadline || null,
      estimate: estimate || null,
      priority,
      recurrenceRule: recurrenceRule || null,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
    };

    if (isEditing && task?.id) {
      onSubmit(data as UpdateTaskInputType);
    } else {
      onSubmit(data as CreateTaskInputType);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Task Name */}
      <div className="space-y-2">
        <Label htmlFor="task-name">Task Name</Label>
        <Input
          id="task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
          className="text-lg"
        />
        {name.length > 500 && (
          <p className="text-xs text-destructive">
            Task name must be 500 characters or less
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="task-description" className="flex items-center gap-2">
          <AlignLeft className="h-4 w-4" />
          Description
        </Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..."
          rows={3}
        />
      </div>

      <Separator />

      {/* List Selection */}
      <div className="space-y-2">
        <Label htmlFor="task-list" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          List
        </Label>
        <Select
          value={listId.toString()}
          onValueChange={(v) => setListId(parseInt(v))}
        >
          <SelectTrigger id="task-list">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id.toString()}>
                <div className="flex items-center gap-2">
                  <span>{list.emoji}</span>
                  <span>{list.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date and Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date
          </Label>
          <DatePicker
            value={taskDate}
            onChange={setTaskDate}
            placeholder="Select date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-estimate" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Estimate
          </Label>
          <TimePicker
            value={estimate}
            onChange={setEstimate}
            placeholder="HH:mm"
          />
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="task-priority" className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          Priority
        </Label>
        <PrioritySelect
          value={priority}
          onChange={setPriority}
          showLabel={true}
        />
      </div>

      {/* Labels */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Labels
        </Label>
        <LabelPicker
          availableLabels={labels}
          selectedIds={selectedLabelIds}
          onChange={setSelectedLabelIds}
          onCreateLabel={onCreateLabel}
        />
      </div>

      {/* Recurrence */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Recurrence
        </Label>
        <RecurrencePicker
          value={recurrenceRule}
          onChange={setRecurrenceRule}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
            ? "Save Changes"
            : "Create Task"}
        </Button>
      </div>
    </form>
  );
}

// Compact inline form for quick task creation
export function TaskFormCompact({
  lists,
  defaultListId,
  onSubmit,
  onCancel,
  className,
}: {
  lists: ListType[];
  defaultListId?: number;
  onSubmit: (data: CreateTaskInputType) => void;
  onCancel?: () => void;
  className?: string;
}) {
  const [name, setName] = React.useState("");
  const [listId, setListId] = React.useState<number>(
    defaultListId || lists[0]?.id || 0
  );
  const [priority, setPriority] = React.useState<Priority>("none");
  const [taskDate, setTaskDate] = React.useState<string | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      listId,
      priority,
      taskDate: taskDate || null,
    });

    // Reset form
    setName("");
    setPriority("none");
    setTaskDate(undefined);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add a task..."
        autoFocus
      />

      <div className="flex items-center gap-2">
        <Select
          value={listId.toString()}
          onValueChange={(v) => setListId(parseInt(v))}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lists.map((list) => (
              <SelectItem key={list.id} value={list.id.toString()}>
                <span className="flex items-center gap-1">
                  <span>{list.emoji}</span>
                  <span className="truncate">{list.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DatePicker
          value={taskDate}
          onChange={setTaskDate}
          className="h-8 text-xs"
        />

        <div className="flex-1" />

        <div className="flex gap-1">
          {(["high", "medium", "low", "none"] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                "h-6 w-6 rounded flex items-center justify-center text-xs transition-colors",
                priority === p
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
              title={p}
            >
              {p === "high" && "🔴"}
              {p === "medium" && "🟡"}
              {p === "low" && "🔵"}
              {p === "none" && "⚪"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!name.trim()}>
          Add Task
        </Button>
      </div>
    </form>
  );
}
