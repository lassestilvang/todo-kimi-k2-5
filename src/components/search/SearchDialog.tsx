/**
 * SearchDialog Component
 * Global search modal with results
 */

"use client";

import * as React from "react";
import { Command } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchBar } from "./SearchBar";
import { SearchResults, type SearchResult } from "./SearchResults";

export interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
  onSearch: (query: string) => Promise<SearchResult[]> | SearchResult[];
  placeholder?: string;
  className?: string;
}

export function SearchDialog({
  isOpen,
  onClose,
  onSelect,
  onSearch,
  placeholder = "Search tasks, lists, and labels...",
  className,
}: SearchDialogProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  // Reset when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  React.useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await onSearch(query);
        setResults(searchResults);
        setHighlightedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(search, 150);
    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results.length, onClose]);

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-2xl gap-0 overflow-hidden p-0",
          className
        )}
      >
        {/* Search Input */}
        <div className="border-b p-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={placeholder}
            isLoading={isLoading}
            autoFocus
            className="text-base"
          />
        </div>

        {/* Results */}
        <div className="max-h-[60vh]">
          <SearchResults
            results={results}
            query={query}
            onSelect={handleSelect}
            onClose={onClose}
            highlightedIndex={highlightedIndex}
            isLoading={isLoading}
          />
        </div>

        {/* Footer hints */}
        {results.length > 0 && (
          <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1 font-sans">
                  ↑
                </kbd>
                <kbd className="rounded border bg-background px-1 font-sans">
                  ↓
                </kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1 font-sans">
                  ↵
                </kbd>
                <span>to select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1 font-sans">
                  esc
                </kbd>
                <span>to close</span>
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Task detail in modal (for mobile)
export interface TaskDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
  children?: React.ReactNode;
  className?: string;
}

export function TaskDetailDialog({
  isOpen,
  onClose,
  taskId,
  children,
  className,
}: TaskDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-lg h-[90vh] flex flex-col",
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
