/**
 * LabelsSection Component
 * Label filter section in sidebar
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarSection, ColorDot } from "./Sidebar";
import type { Label } from "@/lib/types";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  X,
} from "lucide-react";

interface LabelWithTaskCount extends Label {
  taskCount: number;
}

interface LabelsSectionProps {
  labels: LabelWithTaskCount[];
  selectedLabelIds?: number[];
  onLabelToggle: (labelId: number) => void;
  onLabelCreate?: () => void;
  onLabelEdit?: (label: Label) => void;
  onLabelDelete?: (labelId: number) => void;
  isLoading?: boolean;
}

/**
 * Labels section for sidebar
 * Shows all labels with multi-select filtering
 */
export function LabelsSection({
  labels,
  selectedLabelIds = [],
  onLabelToggle,
  onLabelCreate,
  onLabelEdit,
  onLabelDelete,
  isLoading,
}: LabelsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Sort labels by name
  const sortedLabels = [...labels].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SidebarSection
      title="Labels"
      icon={<Tag className="w-4 h-4" />}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      {/* Selected labels indicator */}
      {selectedLabelIds.length > 0 && (
        <div className="flex items-center gap-1 px-2 mb-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {selectedLabelIds.length} selected
          </span>
          <button
            onClick={() => selectedLabelIds.forEach((id) => onLabelToggle(id))}
            className="text-xs text-destructive hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <nav className="space-y-0.5">
        {sortedLabels.map((label) => (
          <LabelItem
            key={label.id}
            label={label}
            isSelected={selectedLabelIds.includes(label.id)}
            onToggle={() => onLabelToggle(label.id)}
            onEdit={onLabelEdit ? () => onLabelEdit(label) : undefined}
            onDelete={onLabelDelete ? () => onLabelDelete(label.id) : undefined}
          />
        ))}

        {/* Empty state */}
        {!isLoading && labels.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            No labels yet
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-2 px-2 py-1">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-7 bg-sidebar-accent/50 rounded animate-pulse"
              />
            ))}
          </div>
        )}
      </nav>

      {/* Add label button */}
      {onLabelCreate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLabelCreate}
          className="w-full mt-2 justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Add Label
        </Button>
      )}
    </SidebarSection>
  );
}

/**
 * Individual label item with toggle and context menu
 */
function LabelItem({
  label,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
}: {
  label: LabelWithTaskCount;
  isSelected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-md",
        isSelected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
      )}
    >
      <button
        onClick={onToggle}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground text-left min-w-0"
      >
        <ColorDot color={label.color} className="flex-shrink-0" />
        <span className="truncate flex-1">{label.name}</span>
        {label.taskCount > 0 && (
          <span className="flex-shrink-0 text-xs text-muted-foreground">
            {label.taskCount}
          </span>
        )}
        {isSelected && (
          <X className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Context menu for label actions */}
      {(onEdit || onDelete) && (
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-sidebar-accent-foreground/10",
                showMenu && "opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-sidebar-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * Label badge for display
 */
export function LabelBadge({
  label,
  onRemove,
  className,
}: {
  label: Label;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs",
        "bg-secondary text-secondary-foreground",
        className
      )}
    >
      <ColorDot color={label.color} />
      <span className="truncate">{label.name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-secondary-foreground/10 rounded p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/**
 * Compact label selector for mobile or inline use
 */
export function LabelSelector({
  labels,
  selectedIds,
  onToggle,
  className,
}: {
  labels: LabelWithTaskCount[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {labels.map((label) => (
        <button
          key={label.id}
          onClick={() => onToggle(label.id)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors",
            selectedIds.includes(label.id)
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <ColorDot
            color={label.color}
            className={selectedIds.includes(label.id) ? "bg-white" : ""}
          />
          <span>{label.name}</span>
          {label.taskCount > 0 && (
            <span className="opacity-60">({label.taskCount})</span>
          )}
        </button>
      ))}
    </div>
  );
}
