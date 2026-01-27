/**
 * TaskMeta Component
 * Badges for due date, priority, estimate, subtasks, attachments, and labels
 */

"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  ListTodo,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Priority, Label } from "@/lib/types";

export interface TaskMetaProps {
  dueDate?: string | null;
  priority?: Priority;
  estimate?: string | null;
  subtaskCount?: { completed: number; total: number };
  attachmentCount?: number;
  labels?: Label[];
  maxVisibleLabels?: number;
  showLabels?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function TaskMeta({
  dueDate,
  priority,
  estimate,
  subtaskCount,
  attachmentCount,
  labels,
  maxVisibleLabels = 2,
  showLabels = true,
  size = "sm",
  className,
}: TaskMetaProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  };

  const renderDueDate = () => {
    if (!dueDate) return null;

    const date = parseISO(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    const isTodayDate = isToday(date);
    const isTomorrowDate = isTomorrow(date);

    let displayText: string;
    let colorClass: string;

    if (isTodayDate) {
      displayText = "Today";
      colorClass = "text-blue-500";
    } else if (isTomorrowDate) {
      displayText = "Tomorrow";
      colorClass = "text-green-500";
    } else if (isOverdue) {
      displayText = format(date, "MMM d");
      colorClass = "text-destructive";
    } else {
      displayText = format(date, "MMM d");
      colorClass = "text-muted-foreground";
    }

    return (
      <span className={cn("inline-flex items-center gap-1", colorClass)}>
        <Calendar className={iconSizes[size]} />
        <span>{displayText}</span>
        {isOverdue && <AlertCircle className={cn(iconSizes[size], "h-3 w-3")} />}
      </span>
    );
  };

  const renderEstimate = () => {
    if (!estimate) return null;

    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Clock className={iconSizes[size]} />
        <span>{estimate}</span>
      </span>
    );
  };

  const renderSubtasks = () => {
    if (!subtaskCount || subtaskCount.total === 0) return null;

    const { completed, total } = subtaskCount;
    const isComplete = completed === total;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1",
          isComplete ? "text-green-500" : "text-muted-foreground"
        )}
      >
        <ListTodo className={iconSizes[size]} />
        <span>
          {completed}/{total}
        </span>
      </span>
    );
  };

  const renderAttachments = () => {
    if (!attachmentCount || attachmentCount === 0) return null;

    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Paperclip className={iconSizes[size]} />
        <span>{attachmentCount}</span>
      </span>
    );
  };

  const renderLabels = () => {
    if (!labels || labels.length === 0 || !showLabels) return null;

    const visibleLabels = labels.slice(0, maxVisibleLabels);
    const remainingCount = labels.length - maxVisibleLabels;

    return (
      <div className="inline-flex items-center gap-1">
        {visibleLabels.map((label) => (
          <LabelBadge key={label.id} label={label} size={size} />
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground">
            +{remainingCount}
          </span>
        )}
      </div>
    );
  };

  const hasAnyMeta =
    dueDate ||
    estimate ||
    (subtaskCount && subtaskCount.total > 0) ||
    (attachmentCount && attachmentCount > 0) ||
    (labels && labels.length > 0 && showLabels);

  if (!hasAnyMeta) return null;

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-2",
        sizeClasses[size],
        className
      )}
    >
      {renderDueDate()}
      {renderEstimate()}
      {renderSubtasks()}
      {renderAttachments()}
      {renderLabels()}
    </div>
  );
}

// Individual label badge
export interface LabelBadgeProps {
  label: Label;
  size?: "sm" | "md";
  onRemove?: () => void;
  className?: string;
}

export function LabelBadge({
  label,
  size = "sm",
  onRemove,
  className,
}: LabelBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0 h-4",
    md: "text-xs px-2 py-0.5 h-5",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-normal border-0",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${label.color}20`,
        color: label.color,
      }}
    >
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-70"
        >
          ×
        </button>
      )}
    </Badge>
  );
}

// Compact version for minimal display
export function TaskMetaCompact({
  dueDate,
  subtaskCount,
  className,
}: {
  dueDate?: string | null;
  subtaskCount?: { completed: number; total: number };
  className?: string;
}) {
  if (!dueDate && (!subtaskCount || subtaskCount.total === 0)) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      {dueDate && (
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(parseISO(dueDate), "MMM d")}
        </span>
      )}
      {subtaskCount && subtaskCount.total > 0 && (
        <span className="inline-flex items-center gap-1">
          <ListTodo className="h-3 w-3" />
          {subtaskCount.completed}/{subtaskCount.total}
        </span>
      )}
    </div>
  );
}
