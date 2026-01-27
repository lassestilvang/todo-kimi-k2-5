/**
 * EmojiPicker Component
 * Emoji selector for lists
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

// Common emoji categories
const emojiCategories = {
  "Frequently Used": ["📥", "📋", "✅", "⭐", "📅", "📝", "💼", "🏠", "🎯", "🚀"],
  "Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘"],
  "Objects": ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸"],
  "Symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖"],
  "Flags": ["🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇺🇳", "🇪🇺", "🇦🇨", "🇦🇩", "🇦🇪", "🇦🇫", "🇦🇬", "🇦🇮", "🇦🇱"],
};

const sizeClasses = {
  sm: "h-8 w-8 text-base",
  md: "h-10 w-10 text-xl",
  lg: "h-12 w-12 text-2xl",
};

export function EmojiPicker({
  value,
  onChange,
  size = "md",
  disabled = false,
  className,
}: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "flex items-center justify-center p-0 font-normal",
            sizeClasses[size],
            className
          )}
        >
          {value || "📋"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* Search */}
        <div className="border-b p-2">
          <input
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Emoji grid */}
        <div className="max-h-64 overflow-y-auto p-2">
          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <div key={category} className="mb-3">
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                {category}
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded hover:bg-accent transition-colors",
                      value === emoji && "bg-accent ring-1 ring-ring"
                    )}
                  >
                    <span className="text-lg">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Native picker option */}
        <div className="border-t p-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input p-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <span>Use system emoji picker</span>
            <input
              type="text"
              className="absolute opacity-0 w-0 h-0"
              maxLength={2}
              onChange={(e) => {
                if (e.target.value) {
                  handleSelect(e.target.value);
                }
              }}
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact inline version
export function EmojiPickerCompact({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 text-lg", className)}
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {emojiCategories["Frequently Used"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent transition-colors"
            >
              <span>{emoji}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
