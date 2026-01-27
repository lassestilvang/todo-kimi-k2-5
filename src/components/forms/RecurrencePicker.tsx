/**
 * RecurrencePicker Component
 * Recurring task configuration
 */

"use client";

import * as React from "react";
import { Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "./DatePicker";
import type { RecurrenceRule } from "@/lib/types";

export interface RecurrencePickerProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | undefined) => void;
  disabled?: boolean;
  className?: string;
}

type RecurrenceType = "daily" | "weekly" | "monthly" | "yearly" | "weekday";

interface RecurrenceOption {
  value: RecurrenceType;
  label: string;
  description: string;
}

const recurrenceOptions: RecurrenceOption[] = [
  { value: "daily", label: "Daily", description: "Every day" },
  { value: "weekday", label: "Weekdays", description: "Mon-Fri only" },
  { value: "weekly", label: "Weekly", description: "Every week" },
  { value: "monthly", label: "Monthly", description: "Every month" },
  { value: "yearly", label: "Yearly", description: "Every year" },
];

const weekDays = [
  { value: 0, label: "Sun", full: "Sunday" },
  { value: 1, label: "Mon", full: "Monday" },
  { value: 2, label: "Tue", full: "Tuesday" },
  { value: 3, label: "Wed", full: "Wednesday" },
  { value: 4, label: "Thu", full: "Thursday" },
  { value: 5, label: "Fri", full: "Friday" },
  { value: 6, label: "Sat", full: "Saturday" },
];

export function RecurrencePicker({
  value,
  onChange,
  disabled = false,
  className,
}: RecurrencePickerProps) {
  const [open, setOpen] = React.useState(false);

  const isRecurring = !!value;

  // Get display type (weekday is a special case of daily)
  const getDisplayType = (): RecurrenceType => {
    if (!value) return "daily";
    if (
      value.frequency === "daily" &&
      value.daysOfWeek?.length === 5 &&
      value.daysOfWeek.every((d) => d >= 1 && d <= 5)
    ) {
      return "weekday";
    }
    return value.frequency;
  };

  const displayType = getDisplayType();

  const handleTypeChange = (type: RecurrenceType) => {
    if (type === "weekday") {
      onChange({
        frequency: "daily",
        daysOfWeek: [1, 2, 3, 4, 5],
      });
    } else {
      onChange({
        frequency: type,
      });
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setOpen(false);
  };

  const handleToggleDay = (day: number) => {
    if (!value) return;

    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();

    onChange({
      ...value,
      daysOfWeek: newDays.length > 0 ? newDays : undefined,
    });
  };

  const handleIntervalChange = (interval: number) => {
    if (!value) return;
    onChange({
      ...value,
      interval: interval > 1 ? interval : undefined,
    });
  };

  const handleEndDateChange = (endDate: string | undefined) => {
    if (!value) return;
    onChange({
      ...value,
      endDate: endDate || undefined,
    });
  };

  const handleOccurrencesChange = (occurrences: number | undefined) => {
    if (!value) return;
    onChange({
      ...value,
      occurrences: occurrences || undefined,
    });
  };

  // Generate summary text
  const getSummaryText = (): string => {
    if (!value) return "Does not repeat";

    const interval = value.interval || 1;
    const freq = value.frequency;

    if (displayType === "weekday") {
      return "Every weekday (Mon-Fri)";
    }

    let text = "";
    if (interval === 1) {
      text = freq === "daily" ? "Every day" : `Every ${freq.slice(0, -2)}`;
    } else {
      text = `Every ${interval} ${freq === "daily" ? "days" : `${freq.slice(0, -2)}s`}`;
    }

    if (value.daysOfWeek && value.daysOfWeek.length > 0 && freq === "weekly") {
      const dayNames = value.daysOfWeek.map(
        (d) => weekDays.find((wd) => wd.value === d)?.label
      );
      text += ` on ${dayNames.join(", ")}`;
    }

    return text;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start",
            !isRecurring && "text-muted-foreground",
            className
          )}
        >
          <Repeat className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{getSummaryText()}</span>
          {isRecurring && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          {/* Recurrence type */}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select
              value={displayType}
              onValueChange={(v) => handleTypeChange(v as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div>{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          <div className="space-y-2">
            <Label>Every</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={value?.interval || 1}
                onChange={(e) =>
                  handleIntervalChange(parseInt(e.target.value) || 1)
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {value?.frequency === "daily"
                  ? "days"
                  : value?.frequency === "weekly"
                  ? "weeks"
                  : value?.frequency === "monthly"
                  ? "months"
                  : "years"}
              </span>
            </div>
          </div>

          {/* Days of week (for weekly) */}
          {value?.frequency === "weekly" && (
            <div className="space-y-2">
              <Label>On days</Label>
              <div className="flex gap-1">
                {weekDays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleToggleDay(day.value)}
                    className={cn(
                      "h-8 w-8 rounded-md text-xs font-medium transition-colors",
                      value.daysOfWeek?.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-accent"
                    )}
                    title={day.full}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End condition */}
          <div className="space-y-2">
            <Label>Ends</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  id="endNever"
                  checked={!value?.endDate && !value?.occurrences}
                  onChange={() => {
                    if (value) {
                      onChange({
                        ...value,
                        endDate: undefined,
                        occurrences: undefined,
                      });
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="endNever" className="text-sm font-normal">
                  Never
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  id="endOn"
                  checked={!!value?.endDate}
                  onChange={() => {}}
                  className="h-4 w-4"
                />
                <Label htmlFor="endOn" className="text-sm font-normal">
                  On date
                </Label>
              </div>
              {value?.endDate && (
                <div className="ml-6">
                  <DatePicker
                    value={value.endDate}
                    onChange={handleEndDateChange}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  id="endAfter"
                  checked={!!value?.occurrences}
                  onChange={() => {}}
                  className="h-4 w-4"
                />
                <Label htmlFor="endAfter" className="text-sm font-normal">
                  After
                </Label>
              </div>
              {value?.occurrences && (
                <div className="ml-6 flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={value.occurrences}
                    onChange={(e) =>
                      handleOccurrencesChange(parseInt(e.target.value) || 1)
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    occurrences
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Clear button */}
          {isRecurring && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Remove recurrence
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Simple toggle version
export function RecurrenceToggle({
  value,
  onChange,
  className,
}: {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | undefined) => void;
  className?: string;
}) {
  const isRecurring = !!value;

  return (
    <Button
      type="button"
      variant={isRecurring ? "default" : "outline"}
      size="sm"
      onClick={() => {
        if (isRecurring) {
          onChange(undefined);
        } else {
          onChange({ frequency: "daily" });
        }
      }}
      className={cn("gap-2", className)}
    >
      <Repeat className="h-4 w-4" />
      {isRecurring ? "Repeating" : "Repeat"}
    </Button>
  );
}
