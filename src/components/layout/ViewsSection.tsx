/**
 * ViewsSection Component
 * Navigation links for built-in views (Today, Next 7 Days, etc.)
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SidebarSection, SidebarItem } from "./Sidebar";
import type { TaskView } from "@/lib/types";
import {
  Sun,
  CalendarDays,
  Calendar,
  Inbox,
  CheckCircle,
} from "lucide-react";

interface ViewsSectionProps {
  currentView: TaskView;
  onViewChange: (view: TaskView) => void;
  counts?: Record<TaskView, number>;
  overdueCount?: number;
}

interface ViewItem {
  view: TaskView;
  title: string;
  icon: React.ReactNode;
}

const VIEWS: ViewItem[] = [
  { view: "today", title: "Today", icon: <Sun className="w-4 h-4" /> },
  { view: "next7", title: "Next 7 Days", icon: <CalendarDays className="w-4 h-4" /> },
  { view: "upcoming", title: "Upcoming", icon: <Calendar className="w-4 h-4" /> },
  { view: "all", title: "All", icon: <Inbox className="w-4 h-4" /> },
  { view: "completed", title: "Completed", icon: <CheckCircle className="w-4 h-4" /> },
];

/**
 * Views navigation section for sidebar
 * Shows Today, Next 7 Days, Upcoming, All, and Completed views
 */
export function ViewsSection({
  currentView,
  onViewChange,
  counts,
  overdueCount = 0,
}: ViewsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <SidebarSection
      title="Views"
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <nav className="space-y-0.5">
        {VIEWS.map((viewItem) => {
          const isActive = currentView === viewItem.view;
          const count = counts?.[viewItem.view] ?? 0;

          // Show overdue count for Today view
          const showOverdue = viewItem.view === "today" && overdueCount > 0;
          const displayCount = showOverdue ? overdueCount : count;

          return (
            <SidebarItem
              key={viewItem.view}
              icon={viewItem.icon}
              title={viewItem.title}
              count={displayCount}
              isActive={isActive}
              isOverdue={showOverdue}
              onClick={() => onViewChange(viewItem.view)}
            />
          );
        })}
      </nav>
    </SidebarSection>
  );
}

/**
 * Compact view selector for mobile or collapsed sidebar
 */
export function ViewsSelector({
  currentView,
  onViewChange,
  className,
}: {
  currentView: TaskView;
  onViewChange: (view: TaskView) => void;
  className?: string;
}) {
  const currentViewItem = VIEWS.find((v) => v.view === currentView);

  return (
    <div className={cn("relative", className)}>
      <select
        value={currentView}
        onChange={(e) => onViewChange(e.target.value as TaskView)}
        className="w-full appearance-none bg-transparent border border-border rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {VIEWS.map((view) => (
          <option key={view.view} value={view.view}>
            {view.title}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        {currentViewItem?.icon}
      </div>
    </div>
  );
}

/**
 * Get view icon by view type
 */
export function getViewIcon(view: TaskView): React.ReactNode {
  const viewItem = VIEWS.find((v) => v.view === view);
  return viewItem?.icon ?? <Inbox className="w-4 h-4" />;
}

/**
 * Get view title by view type
 */
export function getViewTitle(view: TaskView): string {
  const viewItem = VIEWS.find((v) => v.view === view);
  return viewItem?.title ?? "All";
}
