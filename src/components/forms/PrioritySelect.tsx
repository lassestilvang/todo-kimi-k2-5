/**
 * PrioritySelect Component
 * Priority dropdown with color indicators
 */

"use client";

import * as React from "react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority } from "@/lib/types";

export interface PrioritySelectProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  size?: "sm" | "md";
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

interface PriorityOption {
  value: Priority;
  label: string;
  color: string;
  bgColor: string;
}

const priorityOptions: PriorityOption[] = [
  {
    value: "high",
    label: "High",
    color: "var(--priority-high)",
    bgColor: "var(--priority-high-bg)",
  },
  {
    value: "medium",
    label: "Medium",
    color: "var(--priority-medium)",
    bgColor: "var(--priority-medium-bg)",
  },
  {
    value: "low",
    label: "Low",
    color: "var(--priority-low)",
    bgColor: "var(--priority-low-bg)",
  },
  {
    value: "none",
    label: "None",
    color: "var(--priority-none)",
    bgColor: "var(--priority-none-bg)",
  },
];

export function PrioritySelect({
  value,
  onChange,
  size = "md",
  showLabel = true,
  disabled = false,
  className,
}: PrioritySelectProps) {
  const selectedOption = priorityOptions.find((o) => o.value === value);

  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
  };

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Priority)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          sizeClasses[size],
          "w-full",
          className
        )}
      >
        <SelectValue>
          {selectedOption && (
            <div className="flex items-center gap-2">
              <Flag
                className="h-4 w-4"
                style={{ color: selectedOption.color }}
                fill={selectedOption.value !== "none" ? selectedOption.color : "none"}
              />
              {showLabel && <span>{selectedOption.label}</span>}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {priorityOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded"
                style={{ backgroundColor: option.bgColor }}
              >
                <Flag
                  className="h-3 w-3"
                  style={{ color: option.color }}
                  fill={option.value !== "none" ? option.color : "none"}
                />
              </span>
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Button-style selector for quick toggling
export function PriorityButtonGroup({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-7 text-xs px-2",
    md: "h-9 text-sm px-3",
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {priorityOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md border transition-colors",
            sizeClasses[size],
            value === option.value
              ? "border-transparent"
              : "border-input bg-background hover:bg-accent",
          )}
          style={
            value === option.value
              ? {
                  backgroundColor: option.bgColor,
                  color: option.color,
                }
              : undefined
          }
          title={option.label}
        >
          <Flag
            className="h-3.5 w-3.5"
            fill={option.value !== "none" && value === option.value ? option.color : "none"}
            style={{ color: option.color }}
          />
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
