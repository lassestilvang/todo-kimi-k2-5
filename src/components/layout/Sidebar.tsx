/**
 * Sidebar Component
 * Collapsible sidebar with sections (views, lists, labels)
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { TaskView } from "@/lib/types";

interface SidebarProps {
  viewsSection: React.ReactNode;
  listsSection: React.ReactNode;
  labelsSection: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Main sidebar component containing all navigation sections
 */
export function Sidebar({
  viewsSection,
  listsSection,
  labelsSection,
  isCollapsed = false,
  onToggle,
  className,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4">
        <div className={cn("flex items-center gap-2", isCollapsed && "hidden")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <span className="font-semibold text-sidebar-foreground">
            Task Planner
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "mx-auto"
            )}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Collapse toggle - Desktop only */}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="hidden lg:flex h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Sidebar Content */}
      <ScrollArea className="flex-1">
        <div className={cn("py-2", isCollapsed ? "px-2" : "px-3")}>
          {/* Views Section */}
          <div className={cn("mb-4", isCollapsed && "hidden")}>
            {viewsSection}
          </div>

          {/* Lists Section */}
          <div className={cn("mb-4", isCollapsed && "hidden")}>
            {listsSection}
          </div>

          {/* Labels Section */}
          <div className={cn("mb-4", isCollapsed && "hidden")}>
            {labelsSection}
          </div>
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn("text-xs text-sidebar-muted-foreground", isCollapsed && "hidden")}>
          <p>Task Planner v1.0</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SIDEBAR SECTION COMPONENTS
// ============================================================================

interface SidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Collapsible section for sidebar
 */
export function SidebarSection({
  title,
  icon,
  isExpanded = true,
  onToggle,
  children,
  className,
}: SidebarSectionProps) {
  return (
    <div className={cn("", className)}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {onToggle && (
          <svg
            className={cn(
              "w-4 h-4 text-sidebar-muted-foreground transition-transform",
              !isExpanded && "-rotate-90"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {isExpanded && <div className="mt-1">{children}</div>}
    </div>
  );
}

// ============================================================================
// SIDEBAR ITEM COMPONENTS
// ============================================================================

interface SidebarItemProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  count?: number;
  isActive?: boolean;
  isOverdue?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Individual navigation item for sidebar
 */
export function SidebarItem({
  icon,
  emoji,
  title,
  count,
  isActive = false,
  isOverdue = false,
  onClick,
  className,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {emoji ? (
          <span className="flex-shrink-0">{emoji}</span>
        ) : (
          icon && <span className="flex-shrink-0">{icon}</span>
        )}
        <span className="truncate">{title}</span>
      </div>

      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "flex-shrink-0 ml-2 text-xs px-1.5 py-0.5 rounded-full",
            isOverdue
              ? "bg-destructive text-destructive-foreground"
              : "bg-sidebar-accent text-sidebar-accent-foreground",
            isActive && "bg-sidebar-primary/20"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Color dot indicator for lists/labels
 */
export function ColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("w-2 h-2 rounded-full flex-shrink-0", className)}
      style={{ backgroundColor: color }}
    />
  );
}
