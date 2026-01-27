/**
 * PriorityBadge Component
 * Color-coded priority indicator with icon
 */

"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";

const priorityBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      priority: {
        high: "bg-[var(--priority-high-bg)] text-[var(--priority-high)]",
        medium: "bg-[var(--priority-medium-bg)] text-[var(--priority-medium)]",
        low: "bg-[var(--priority-low-bg)] text-[var(--priority-low)]",
        none: "bg-muted text-muted-foreground",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0",
        md: "text-xs px-2 py-0.5",
        lg: "text-sm px-2.5 py-1",
      },
    },
    defaultVariants: {
      priority: "none",
      size: "md",
    },
  }
);

const priorityConfig: Record<
  Priority,
  { label: string; icon: React.ReactNode }
> = {
  high: {
    label: "High",
    icon: <Flag className="h-3 w-3 fill-current" />,
  },
  medium: {
    label: "Medium",
    icon: <Flag className="h-3 w-3 fill-current" />,
  },
  low: {
    label: "Low",
    icon: <Flag className="h-3 w-3 fill-current" />,
  },
  none: {
    label: "None",
    icon: null,
  },
};

export interface PriorityBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof priorityBadgeVariants> {
  priority: Priority;
  showLabel?: boolean;
}

export function PriorityBadge({
  priority,
  size,
  showLabel = true,
  className,
  ...props
}: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  if (priority === "none" && !showLabel) {
    return null;
  }

  return (
    <span
      className={cn(priorityBadgeVariants({ priority, size }), className)}
      {...props}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// Standalone priority icon for compact display
export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const config = priorityConfig[priority];
  const colorClass =
    {
      high: "text-[var(--priority-high)]",
      medium: "text-[var(--priority-medium)]",
      low: "text-[var(--priority-low)]",
      none: "text-muted-foreground",
    }[priority] || "text-muted-foreground";

  if (priority === "none") return null;

  return (
    <span className={cn(colorClass, className)}>{config.icon}</span>
  );
}

export { priorityBadgeVariants };