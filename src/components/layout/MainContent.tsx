/**
 * MainContent Component
 * Primary content area showing task list and detail view
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MainContentProps {
  header: React.ReactNode;
  children: React.ReactNode;
  taskDetail?: React.ReactNode;
  viewMode?: "list" | "split";
  className?: string;
}

/**
 * Main content area with optional split view for task details
 * 
 * Supports two view modes:
 * - "list": Full-width content area
 * - "split": Content area + task detail panel side by side
 */
export function MainContent({
  header,
  children,
  taskDetail,
  viewMode = "list",
  className,
}: MainContentProps) {
  const isSplit = viewMode === "split" && taskDetail;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header - always at top */}
      {header}

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div
          className={cn(
            "flex flex-col h-full",
            isSplit ? "w-1/2" : "w-full"
          )}
        >
          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-6">{children}</div>
          </ScrollArea>
        </div>

        {/* Task detail panel - only in split mode */}
        {isSplit && (
          <div className="w-1/2 border-l border-border bg-background">
            <ScrollArea className="h-full">
              {taskDetail}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state for main content
 */
export function MainContentEmpty({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/**
 * Loading state for main content
 */
export function MainContentLoading({
  header,
  className,
}: {
  header?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {header}
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="w-32 h-4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
