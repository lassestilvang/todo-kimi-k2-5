/**
 * DatePicker Component
 * Date selection with shortcuts (Today, Tomorrow, Next Week)
 */

"use client";

import * as React from "react";
import { format, addDays, addWeeks, startOfWeek, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  shortcuts?: DateShortcut[];
  disabled?: boolean;
  className?: string;
}

export interface DateShortcut {
  label: string;
  value: string; // YYYY-MM-DD
}

const defaultShortcuts: DateShortcut[] = [
  { label: "Today", value: format(new Date(), "yyyy-MM-dd") },
  { label: "Tomorrow", value: format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { label: "Next Week", value: format(addWeeks(startOfWeek(new Date()), 1), "yyyy-MM-dd") },
];

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  shortcuts = defaultShortcuts,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = value ? parseISO(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      onChange(format(date, "yyyy-MM-dd"));
    } else {
      onChange(undefined);
    }
    setOpen(false);
  };

  const handleShortcut = (shortcutValue: string) => {
    onChange(shortcutValue);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const minDateObj = minDate ? parseISO(minDate) : undefined;
  const maxDateObj = maxDate ? parseISO(maxDate) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            <span className="flex-1">{format(selectedDate, "PPP")}</span>
          ) : (
            <span className="flex-1">{placeholder}</span>
          )}
          {value && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Shortcuts */}
        {shortcuts.length > 0 && (
          <div className="flex gap-1 border-b p-3">
            {shortcuts.map((shortcut) => (
              <Button
                key={shortcut.label}
                variant="outline"
                size="sm"
                onClick={() => handleShortcut(shortcut.value)}
                className={cn(
                  "text-xs",
                  value === shortcut.value && "bg-accent"
                )}
              >
                {shortcut.label}
              </Button>
            ))}
          </div>
        )}
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDateObj && date < minDateObj) return true;
            if (maxDateObj && date > maxDateObj) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Compact inline version
export function DatePickerCompact({
  value,
  onChange,
  className,
}: {
  value?: string;
  onChange: (date: string | undefined) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? parseISO(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      onChange(format(date, "yyyy-MM-dd"));
    } else {
      onChange(undefined);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {selectedDate ? format(selectedDate, "MMM d") : "Set date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-1 border-b p-2">
          {defaultShortcuts.slice(0, 3).map((shortcut) => (
            <Button
              key={shortcut.label}
              variant="outline"
              size="sm"
              onClick={() => {
                onChange(shortcut.value);
                setOpen(false);
              }}
              className="text-xs"
            >
              {shortcut.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
