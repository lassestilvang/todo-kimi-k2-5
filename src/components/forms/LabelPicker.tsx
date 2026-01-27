/**
 * LabelPicker Component
 * Multi-select label picker with search
 */

"use client";

import * as React from "react";
import { Check, Plus, Search, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Label } from "@/lib/types";

export interface LabelPickerProps {
  availableLabels: Label[];
  selectedIds: number[];
  onChange: (labelIds: number[]) => void;
  onCreateLabel?: (name: string) => void;
  maxSelection?: number;
  disabled?: boolean;
  className?: string;
}

export function LabelPicker({
  availableLabels,
  selectedIds,
  onChange,
  onCreateLabel,
  maxSelection,
  disabled = false,
  className,
}: LabelPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedLabels = availableLabels.filter((l) =>
    selectedIds.includes(l.id)
  );

  const filteredLabels = availableLabels.filter(
    (label) =>
      !selectedIds.includes(label.id) &&
      label.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate =
    search &&
    onCreateLabel &&
    !availableLabels.some(
      (l) => l.name.toLowerCase() === search.toLowerCase()
    );

  const toggleLabel = (labelId: number) => {
    if (selectedIds.includes(labelId)) {
      onChange(selectedIds.filter((id) => id !== labelId));
    } else {
      if (maxSelection && selectedIds.length >= maxSelection) {
        return;
      }
      onChange([...selectedIds, labelId]);
    }
  };

  const removeLabel = (labelId: number) => {
    onChange(selectedIds.filter((id) => id !== labelId));
  };

  const handleCreate = () => {
    if (canCreate && search) {
      onCreateLabel(search.trim());
      setSearch("");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label) => (
            <LabelBadge
              key={label.id}
              label={label}
              onRemove={() => removeLabel(label.id)}
            />
          ))}
        </div>
      )}

      {/* Picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start",
              selectedLabels.length === 0 && "text-muted-foreground"
            )}
          >
            <Tag className="mr-2 h-4 w-4" />
            {selectedLabels.length > 0
              ? `${selectedLabels.length} label${
                  selectedLabels.length > 1 ? "s" : ""
                } selected`
              : "Add labels..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          {/* Search */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search labels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* Available labels */}
          <ScrollArea className="h-48">
            <div className="p-1">
              {filteredLabels.length === 0 && !canCreate && (
                <p className="p-2 text-sm text-muted-foreground text-center">
                  {search ? "No labels found" : "No labels available"}
                </p>
              )}

              {filteredLabels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                  </div>
                  {selectedIds.includes(label.id) && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}

              {/* Create new */}
              {canCreate && (
                <button
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create &quot;{search}&quot;</span>
                </button>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {maxSelection && (
            <div className="border-t p-2 text-xs text-muted-foreground text-center">
              {selectedIds.length}/{maxSelection} labels selected
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Individual label badge with remove button
export interface LabelBadgeProps {
  label: Label;
  onRemove?: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function LabelBadge({
  label,
  onRemove,
  size = "sm",
  className,
}: LabelBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] h-5 px-1.5",
    md: "text-xs h-6 px-2",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-normal border-0 gap-1",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${label.color}20`,
        color: label.color,
      }}
    >
      <span
        className={cn("rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")}
        style={{ backgroundColor: label.color }}
      />
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 focus:outline-none"
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </Badge>
  );
}

// Compact inline selector
export function LabelPickerCompact({
  availableLabels,
  selectedIds,
  onChange,
  className,
}: Omit<LabelPickerProps, "onCreateLabel" | "maxSelection">) {
  const [open, setOpen] = React.useState(false);

  const selectedLabels = availableLabels.filter((l) =>
    selectedIds.includes(l.id)
  );

  const unselectedLabels = availableLabels.filter(
    (l) => !selectedIds.includes(l.id)
  );

  const toggleLabel = (labelId: number) => {
    if (selectedIds.includes(labelId)) {
      onChange(selectedIds.filter((id) => id !== labelId));
    } else {
      onChange([...selectedIds, labelId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 px-2 text-xs", className)}
        >
          <Tag className="mr-1.5 h-3.5 w-3.5" />
          {selectedLabels.length > 0 ? (
            <span className="flex items-center gap-1">
              {selectedLabels.slice(0, 2).map((l) => (
                <span
                  key={l.id}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
              ))}
              {selectedLabels.length > 2 && (
                <span>+{selectedLabels.length - 2}</span>
              )}
            </span>
          ) : (
            "Labels"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          {unselectedLabels.map((label) => (
            <button
              key={label.id}
              onClick={() => toggleLabel(label.id)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent transition-colors"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </button>
          ))}
          {selectedLabels.map((label) => (
            <button
              key={label.id}
              onClick={() => toggleLabel(label.id)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm bg-accent"
            >
              <Check className="h-3 w-3" />
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </button>
          ))}
          {availableLabels.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground text-center">
              No labels
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
