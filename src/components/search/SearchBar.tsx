/**
 * SearchBar Component
 * Search input with keyboard shortcut (⌘K)
 */

"use client";

import * as React from "react";
import { Search, X, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  shortcut?: string; // Keyboard shortcut, default: '⌘K'
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = "Search...",
  isLoading = false,
  shortcut = "⌘K",
  autoFocus = false,
  className,
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Escape to clear and blur
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        if (value) {
          onChange("");
        } else {
          inputRef.current?.blur();
          onBlur?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChange, onBlur, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSubmit?.(value);
    }
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-opacity",
          isLoading && "opacity-0"
        )}
      />

      {isLoading && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}

      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "pl-9 pr-20",
          isLoading && "pl-9"
        )}
      />

      {/* Shortcut hint */}
      {!value && shortcut && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
          {shortcut.split("").map((char, i) => (
            <kbd
              key={i}
              className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[10px] font-medium"
            >
              {char}
            </kbd>
          ))}
        </div>
      )}

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
}

// Inline compact version
export function SearchBarCompact({
  value,
  onChange,
  onSubmit,
  placeholder = "Search...",
  className,
}: Omit<SearchBarProps, "shortcut">) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit?.(value)}
        placeholder={placeholder}
        className="h-8 pl-7 pr-7 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// Button that opens search (for mobile/navbar)
export function SearchButton({
  onClick,
  shortcut = "⌘K",
  className,
}: {
  onClick: () => void;
  shortcut?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Search...</span>
      <div className="flex items-center gap-0.5">
        {shortcut.split("").map((char, i) => (
          <kbd
            key={i}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-sans text-[10px] font-medium"
          >
            {char}
          </kbd>
        ))}
      </div>
    </button>
  );
}
