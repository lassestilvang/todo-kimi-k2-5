/**
 * Header Component
 * Top navigation bar with search, view title, and actions
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Search,
  CheckCircle2,
  Circle,
  Menu,
  Plus,
} from "lucide-react";

interface HeaderProps {
  title: string;
  taskCount?: number;
  onSearch?: (query: string) => void;
  onToggleCompleted?: () => void;
  showCompleted?: boolean;
  onMenuClick?: () => void;
  onAddTask?: () => void;
  searchQuery?: string;
  className?: string;
}

/**
 * Header component with search, theme toggle, and view options
 */
export function Header({
  title,
  taskCount,
  onSearch,
  onToggleCompleted,
  showCompleted = false,
  onMenuClick,
  onAddTask,
  searchQuery = "",
  className,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [localSearch, setLocalSearch] = React.useState(searchQuery);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && localSearch !== searchQuery) {
        onSearch(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearch, searchQuery]);

  // Sync with external search query
  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        "px-4 sm:px-6 py-4",
        "border-b border-border bg-background",
        "sticky top-0 z-10",
        className
      )}
    >
      {/* Left section: Menu button, Title, Count */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {taskCount !== undefined && (
            <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {taskCount}
            </span>
          )}
        </div>
      </div>

      {/* Right section: Search, Show Completed, Theme, Add */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        {onSearch && (
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 w-full sm:w-[200px] lg:w-[280px]"
            />
          </div>
        )}

        {/* Show/Hide completed toggle */}
        {onToggleCompleted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCompleted}
            className="hidden sm:flex items-center gap-2"
            title={showCompleted ? "Hide completed" : "Show completed"}
          >
            {showCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden lg:inline">Hide completed</span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" />
                <span className="hidden lg:inline">Show completed</span>
              </>
            )}
          </Button>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Add task button */}
        {onAddTask && (
          <Button onClick={onAddTask} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        )}
      </div>
    </header>
  );
}
