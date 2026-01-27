/**
 * ListsSection Component
 * User-created lists with Inbox at top
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
import { SidebarSection, SidebarItem, ColorDot } from "./Sidebar";
import type { List } from "@/lib/types";
import {
  Inbox,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  List as ListIcon,
} from "lucide-react";

interface ListWithTaskCount extends List {
  taskCount: number;
}

interface ListsSectionProps {
  lists: ListWithTaskCount[];
  selectedListId?: number;
  onListSelect: (listId: number) => void;
  onListCreate?: () => void;
  onListEdit?: (list: List) => void;
  onListDelete?: (listId: number) => void;
  isLoading?: boolean;
}

/**
 * Lists section for sidebar
 * Shows Inbox (always first) and user-created lists
 */
export function ListsSection({
  lists,
  selectedListId,
  onListSelect,
  onListCreate,
  onListEdit,
  onListDelete,
  isLoading,
}: ListsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Separate Inbox (id = 1) from other lists
  const inbox = lists.find((list) => list.id === 1);
  const otherLists = lists.filter((list) => list.id !== 1);

  // Sort other lists by sortOrder
  const sortedLists = [...otherLists].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <SidebarSection
      title="Lists"
      icon={<ListIcon className="w-4 h-4" />}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <nav className="space-y-0.5">
        {/* Inbox - Always first and special */}
        {inbox && (
          <SidebarItem
            icon={<Inbox className="w-4 h-4" />}
            title="Inbox"
            count={inbox.taskCount}
            isActive={selectedListId === inbox.id}
            onClick={() => onListSelect(inbox.id)}
          />
        )}

        {/* User-created lists */}
        {sortedLists.map((list) => (
          <ListItem
            key={list.id}
            list={list}
            isActive={selectedListId === list.id}
            onSelect={() => onListSelect(list.id)}
            onEdit={onListEdit ? () => onListEdit(list) : undefined}
            onDelete={
              onListDelete && list.id !== 1
                ? () => onListDelete(list.id)
                : undefined
            }
          />
        ))}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-2 px-2 py-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 bg-sidebar-accent/50 rounded animate-pulse"
              />
            ))}
          </div>
        )}
      </nav>

      {/* Add list button */}
      {onListCreate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onListCreate}
          className="w-full mt-2 justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          Add List
        </Button>
      )}
    </SidebarSection>
  );
}

/**
 * Individual list item with context menu
 */
function ListItem({
  list,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: {
  list: ListWithTaskCount;
  isActive: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-md",
        isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
      )}
    >
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground text-left min-w-0"
      >
        <span className="flex-shrink-0">{list.emoji}</span>
        <span className="truncate flex-1">{list.name}</span>
        {list.taskCount > 0 && (
          <span className="flex-shrink-0 text-xs text-muted-foreground">
            {list.taskCount}
          </span>
        )}
      </button>

      {/* Context menu for list actions */}
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
 * List color badge
 */
export function ListBadge({
  list,
  className,
}: {
  list: List;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ColorDot color={list.color} />
      <span>{list.emoji}</span>
      <span className="truncate">{list.name}</span>
    </div>
  );
}
