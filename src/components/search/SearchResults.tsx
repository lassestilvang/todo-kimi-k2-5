/**
 * SearchResults Component
 * Search results list
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  List,
  Tag,
  Inbox,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HighlightQuery } from "./HighlightMatch";
import type { Task, List as ListType, Label } from "@/lib/types";

// Search result types
export interface SearchResultTask {
  type: "task";
  id: number;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  listName: string;
  listColor: string;
  labels: string[];
  dueDate?: string | null;
  priority?: string;
  score: number;
}

export interface SearchResultList {
  type: "list";
  id: number;
  name: string;
  emoji: string;
  color: string;
  taskCount: number;
  score: number;
}

export interface SearchResultLabel {
  type: "label";
  id: number;
  name: string;
  color: string;
  taskCount: number;
  score: number;
}

export type SearchResult =
  | SearchResultTask
  | SearchResultList
  | SearchResultLabel;

export interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
  highlightedIndex?: number;
  isLoading?: boolean;
  className?: string;
}

export function SearchResults({
  results,
  query,
  onSelect,
  onClose,
  highlightedIndex = 0,
  isLoading = false,
  className,
}: SearchResultsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    const highlightedItem = itemRefs.current[highlightedIndex];
    if (highlightedItem) {
      highlightedItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && results[highlightedIndex]) {
        e.preventDefault();
        onSelect(results[highlightedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [highlightedIndex, onSelect, results]);

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: {
      tasks: SearchResultTask[];
      lists: SearchResultList[];
      labels: SearchResultLabel[];
    } = {
      tasks: [],
      lists: [],
      labels: [],
    };

    results.forEach((result) => {
      if (result.type === "task") groups.tasks.push(result);
      else if (result.type === "list") groups.lists.push(result);
      else if (result.type === "label") groups.labels.push(result);
    });

    return groups;
  }, [results]);

  if (isLoading) {
    return (
      <div className={cn("p-8 text-center", className)}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className={cn("p-8 text-center", className)}>
        <Search className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 font-medium">No results found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search terms
        </p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className={cn("p-8 text-center", className)}>
        <Search className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Type to search tasks, lists, and labels
        </p>
      </div>
    );
  }

  let globalIndex = 0;

  return (
    <ScrollArea className={cn("max-h-[60vh]", className)} ref={scrollRef}>
      <div className="py-2">
        <AnimatePresence>
          {/* Tasks */}
          {groupedResults.tasks.length > 0 && (
            <ResultSection title="Tasks">
                {groupedResults.tasks.map((task) => {
                const index = globalIndex++;
                return (
                  <TaskResultItem
                    key={task.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    task={task}
                    query={query}
                    isHighlighted={highlightedIndex === index}
                    onClick={() => onSelect(task)}
                  />
                );
              })}
            </ResultSection>
          )}

          {/* Lists */}
          {groupedResults.lists.length > 0 && (
            <ResultSection title="Lists">
                {groupedResults.lists.map((list) => {
                const index = globalIndex++;
                return (
                  <ListResultItem
                    key={list.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    list={list}
                    query={query}
                    isHighlighted={highlightedIndex === index}
                    onClick={() => onSelect(list)}
                  />
                );
              })}
            </ResultSection>
          )}

          {/* Labels */}
          {groupedResults.labels.length > 0 && (
            <ResultSection title="Labels">
                {groupedResults.labels.map((label) => {
                const index = globalIndex++;
                return (
                  <LabelResultItem
                    key={label.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    label={label}
                    query={query}
                    isHighlighted={highlightedIndex === index}
                    onClick={() => onSelect(label)}
                  />
                );
              })}
            </ResultSection>
          )}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}

// Section header for result groups
function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <h3 className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// Task result item
const TaskResultItem = React.forwardRef<
  HTMLButtonElement,
  {
    task: SearchResultTask;
    query: string;
    isHighlighted: boolean;
    onClick: () => void;
  }
>(({ task, query, isHighlighted, onClick }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors",
        isHighlighted ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      {/* Completion status */}
      <div className="mt-0.5">
        {task.isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "truncate text-sm font-medium",
            task.isCompleted && "line-through text-muted-foreground"
          )}
        >
          <HighlightQuery text={task.title} query={query} />
        </p>

        {/* Meta info */}
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="flex items-center gap-1"
            style={{ color: task.listColor }}
          >
            <List className="h-3 w-3" />
            {task.listName}
          </span>
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {task.dueDate}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
TaskResultItem.displayName = "TaskResultItem";

// List result item
const ListResultItem = React.forwardRef<
  HTMLButtonElement,
  {
    list: SearchResultList;
    query: string;
    isHighlighted: boolean;
    onClick: () => void;
  }
>(({ list, query, isHighlighted, onClick }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
        isHighlighted ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ backgroundColor: `${list.color}20` }}
      >
        {list.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">
          <HighlightQuery text={list.name} query={query} />
        </p>
        <p className="text-xs text-muted-foreground">
          {list.taskCount} task{list.taskCount !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
});
ListResultItem.displayName = "ListResultItem";

// Label result item
const LabelResultItem = React.forwardRef<
  HTMLButtonElement,
  {
    label: SearchResultLabel;
    query: string;
    isHighlighted: boolean;
    onClick: () => void;
  }
>(({ label, query, isHighlighted, onClick }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
        isHighlighted ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <Tag
        className="h-4 w-4 shrink-0"
        style={{ color: label.color }}
      />

      <div className="flex-1 min-w-0">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${label.color}20`,
            color: label.color,
          }}
        >
          <HighlightQuery text={label.name} query={query} />
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {label.taskCount} task{label.taskCount !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
});
LabelResultItem.displayName = "LabelResultItem";
