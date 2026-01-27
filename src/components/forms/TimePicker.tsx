/**
 * TimePicker Component
 * HH:mm time input with validation
 */

"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TimePickerProps {
  value?: string; // HH:mm
  onChange: (time: string | undefined) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: number; // Minutes, default: 15
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "HH:mm",
  min,
  max,
  step = 15,
  disabled = false,
  className,
}: TimePickerProps) {
  const [inputValue, setInputValue] = React.useState(value || "");
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  // Update input when value prop changes
  React.useEffect(() => {
    setInputValue(value || "");
    setError(null);
  }, [value]);

  // Validate time format
  const validateTime = (time: string): boolean => {
    if (!time) return true;
    const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!regex.test(time)) return false;

    const [hours, minutes] = time.split(":").map(Number);

    // Check min/max constraints
    if (min) {
      const [minH, minM] = min.split(":").map(Number);
      if (hours < minH || (hours === minH && minutes < minM)) return false;
    }
    if (max) {
      const [maxH, maxM] = max.split(":").map(Number);
      if (hours > maxH || (hours === maxH && minutes > maxM)) return false;
    }

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue) {
      setError(null);
      return;
    }

    if (validateTime(newValue)) {
      setError(null);
      onChange(newValue);
    } else {
      setError("Invalid time");
    }
  };

  const handleBlur = () => {
    if (inputValue && !validateTime(inputValue)) {
      setError("Invalid time format (HH:mm)");
    } else {
      setError(null);
      if (inputValue !== value) {
        onChange(inputValue || undefined);
      }
    }
  };

  const handleClear = () => {
    setInputValue("");
    setError(null);
    onChange(undefined);
  };

  const handleQuickSelect = (hours: number, minutes: number) => {
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
    setInputValue(timeString);
    setError(null);
    onChange(timeString);
    setOpen(false);
  };

  // Generate time options based on step
  const timeOptions = React.useMemo(() => {
    const options: { label: string; value: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += step) {
        const timeString = `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`;
        let label = timeString;

        // Add AM/PM for readability
        const ampm = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 || 12;
        label = `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;

        options.push({ label, value: timeString });
      }
    }
    return options;
  }, [step]);

  // Common quick times
  const quickTimes = [
    { label: "Morning", times: ["08:00", "09:00", "10:00"] },
    { label: "Afternoon", times: ["12:00", "13:00", "14:00", "15:00"] },
    { label: "Evening", times: ["17:00", "18:00", "19:00", "20:00"] },
  ];

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pl-9 pr-8",
                error && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          {/* Quick times */}
          <div className="space-y-2">
            {quickTimes.map((group) => (
              <div key={group.label}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1">
                  {group.times.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const [h, m] = time.split(":").map(Number);
                        handleQuickSelect(h, m);
                      }}
                      className={cn(
                        "text-xs",
                        value === time && "bg-accent"
                      )}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Full time list */}
          <div className="mt-3 border-t pt-2">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              All times
            </p>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {timeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const [h, m] = option.value.split(":").map(Number);
                    handleQuickSelect(h, m);
                  }}
                  className={cn(
                    "w-full justify-start text-xs",
                    value === option.value && "bg-accent"
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// Simple inline version
export function TimePickerCompact({
  value,
  onChange,
  className,
}: {
  value?: string;
  onChange: (time: string | undefined) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Input
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-28"
      />
    </div>
  );
}
