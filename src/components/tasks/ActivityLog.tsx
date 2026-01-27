/**
 * ActivityLog Component
 * Task activity timeline
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Plus,
  Edit3,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Trash2,
  Paperclip,
  ListTodo,
  Bell,
  Clock,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityLog as ActivityLogType, ActivityAction } from "@/lib/types";

export interface ActivityLogProps {
  activities: ActivityLogType[];
  isLoading?: boolean;
  maxItems?: number;
  className?: string;
}

const activityIcons: Record<ActivityAction, React.ReactNode> = {
  created: <Plus className="h-4 w-4" />,
  updated: <Edit3 className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
  uncompleted: <XCircle className="h-4 w-4" />,
  moved: <ArrowRightLeft className="h-4 w-4" />,
  deleted: <Trash2 className="h-4 w-4" />,
  attachment_added: <Paperclip className="h-4 w-4" />,
  attachment_removed: <Paperclip className="h-4 w-4" />,
  subtask_added: <ListTodo className="h-4 w-4" />,
  subtask_completed: <ListTodo className="h-4 w-4" />,
  reminder_triggered: <Bell className="h-4 w-4" />,
};

const activityColors: Record<ActivityAction, string> = {
  created: "bg-green-500/10 text-green-500",
  updated: "bg-blue-500/10 text-blue-500",
  completed: "bg-green-500/10 text-green-500",
  uncompleted: "bg-yellow-500/10 text-yellow-500",
  moved: "bg-purple-500/10 text-purple-500",
  deleted: "bg-red-500/10 text-red-500",
  attachment_added: "bg-gray-500/10 text-gray-500",
  attachment_removed: "bg-gray-500/10 text-gray-500",
  subtask_added: "bg-indigo-500/10 text-indigo-500",
  subtask_completed: "bg-green-500/10 text-green-500",
  reminder_triggered: "bg-orange-500/10 text-orange-500",
};

const activityLabels: Record<ActivityAction, string> = {
  created: "Created",
  updated: "Updated",
  completed: "Completed",
  uncompleted: "Reopened",
  moved: "Moved",
  deleted: "Deleted",
  attachment_added: "Attachment added",
  attachment_removed: "Attachment removed",
  subtask_added: "Subtask added",
  subtask_completed: "Subtask completed",
  reminder_triggered: "Reminder",
};

export function ActivityLog({
  activities,
  isLoading = false,
  maxItems = 50,
  className,
}: ActivityLogProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return <ActivityLogSkeleton className={className} />;
  }

  if (activities.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 text-center",
          className
        )}
      >
        <Activity className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full max-h-[400px]", className)}>
      <div className="relative space-y-0 pr-4">
        {/* Timeline line */}
        <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />

        {displayActivities.map((activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            showTime={true}
            isLast={index === displayActivities.length - 1}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

export interface ActivityItemProps {
  activity: ActivityLogType;
  showTime?: boolean;
  isLast?: boolean;
}

export function ActivityItem({
  activity,
  showTime = true,
  isLast = false,
}: ActivityItemProps) {
  const icon = activityIcons[activity.action];
  const colorClass = activityColors[activity.action];
  const label = activityLabels[activity.action];

  const renderDetails = () => {
    if (activity.oldValue && activity.newValue) {
      // Try to parse as JSON for complex changes
      try {
        const oldParsed = JSON.parse(activity.oldValue);
        const newParsed = JSON.parse(activity.newValue);

        if (oldParsed.name && newParsed.name) {
          return (
            <span className="text-muted-foreground">
              Changed name from &quot;{oldParsed.name}&quot; to &quot;{newParsed.name}&quot;
            </span>
          );
        }
      } catch {
        // Not JSON, show as plain text
      }

      // Simple value change
      return (
        <span className="text-muted-foreground">
          Changed from &quot;{activity.oldValue}&quot; to &quot;{activity.newValue}&quot;
        </span>
      );
    }

    if (activity.newValue) {
      try {
        const parsed = JSON.parse(activity.newValue);
        if (parsed.to) {
          return (
            <span className="text-muted-foreground">Moved to &quot;{parsed.to}&quot;</span>
          );
        }
      } catch {
        return (
          <span className="text-muted-foreground">{activity.newValue}</span>
        );
      }
    }

    return null;
  };

  const activityDate = new Date(activity.createdAt);
  const timeAgo = formatDistanceToNow(activityDate, { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("relative flex gap-4 py-3", isLast && "pb-0")}
    >
      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background",
          colorClass
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {label}
            </p>
            <div className="mt-0.5 text-sm">{renderDetails()}</div>
          </div>

          {showTime && (
            <time
              className="shrink-0 text-xs text-muted-foreground"
              title={format(activityDate, "PPp")}
            >
              {timeAgo}
            </time>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton loader
export function ActivityLogSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-0 pr-4", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Activity icon component for compact view
function ActivityIconCompact({ action }: { action: ActivityAction }) {
  const iconClass = "h-3 w-3";
  switch (action) {
    case "created": return <Plus className={iconClass} />;
    case "updated": return <Edit3 className={iconClass} />;
    case "completed": return <CheckCircle2 className={iconClass} />;
    case "uncompleted": return <XCircle className={iconClass} />;
    case "moved": return <ArrowRightLeft className={iconClass} />;
    case "deleted": return <Trash2 className={iconClass} />;
    case "attachment_added":
    case "attachment_removed": return <Paperclip className={iconClass} />;
    case "subtask_added":
    case "subtask_completed": return <ListTodo className={iconClass} />;
    case "reminder_triggered": return <Bell className={iconClass} />;
    default: return <Activity className={iconClass} />;
  }
}

// Compact version for inline display
export function ActivityLogCompact({
  activities,
  maxItems = 3,
}: {
  activities: ActivityLogType[];
  maxItems?: number;
}) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span className={cn("flex h-5 w-5 items-center justify-center rounded", activityColors[activity.action])}>
            <ActivityIconCompact action={activity.action} />
          </span>
          <span>{activityLabels[activity.action]}</span>
          <span className="ml-auto text-xs">
            {formatDistanceToNow(new Date(activity.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
