/**
 * Date utility functions
 * Formatting helpers for relative time, dates, etc.
 */

import {
  format,
  formatDistance,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  parseISO,
  isSameDay,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

/**
 * Format a date for display with relative formatting
 */
export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return "No date";

  const d = typeof date === "string" ? parseISO(date) : date;

  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";

  return format(d, "EEE, MMM d");
}

/**
 * Format a date for display with year if not current year
 */
export function formatDisplayDate(date: string | Date | null): string {
  if (!date) return "";

  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();

  if (d.getFullYear() === now.getFullYear()) {
    return format(d, "MMM d");
  }

  return format(d, "MMM d, yyyy");
}

/**
 * Format a date with full details
 */
export function formatDateFull(date: string | Date | null): string {
  if (!date) return "";

  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, MMMM d, yyyy");
}

/**
 * Format time distance (e.g., "2 hours ago", "in 3 days")
 */
export function formatTimeDistance(date: string | Date | null): string {
  if (!date) return "";

  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format time distance between two dates
 */
export function formatDistanceBetween(
  from: string | Date,
  to: string | Date
): string {
  const d1 = typeof from === "string" ? parseISO(from) : from;
  const d2 = typeof to === "string" ? parseISO(to) : to;

  return formatDistance(d1, d2);
}

/**
 * Check if a date is overdue (before today)
 */
export function isDateOverdue(date: string | Date | null): boolean {
  if (!date) return false;

  const d = typeof date === "string" ? parseISO(date) : date;
  return isPast(d) && !isToday(d);
}

/**
 * Check if a date is due soon (within next 3 days)
 */
export function isDueSoon(date: string | Date | null): boolean {
  if (!date) return false;

  const d = typeof date === "string" ? parseISO(date) : date;
  const threeDaysFromNow = addDays(new Date(), 3);

  return !isDateOverdue(date) && d <= threeDaysFromNow;
}

/**
 * Get the start and end of the current week
 */
export function getWeekRange(date: Date = new Date()): {
  start: Date;
  end: Date;
} {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * Get the start and end of the current month
 */
export function getMonthRange(date: Date = new Date()): {
  start: Date;
  end: Date;
} {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Get date in YYYY-MM-DD format
 */
export function toDateString(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/**
 * Parse date string in various formats
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  try {
    const parsed = parseISO(dateString);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Format date for API submission
 */
export function formatDateForAPI(date: Date | string | null): string | null {
  if (!date) return null;

  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/**
 * Get human-readable date range
 */
export function formatDateRange(
  start: string | Date | null,
  end: string | Date | null
): string {
  if (!start && !end) return "Any time";
  if (!end || start === end) return formatRelativeDate(start);

  const s = typeof start === "string" ? parseISO(start) : start;
  const e = typeof end === "string" ? parseISO(end) : end;

  if (s && e && isSameDay(s, e)) {
    return formatRelativeDate(s);
  }

  return `${formatRelativeDate(s)} - ${formatRelativeDate(e)}`;
}

/**
 * Get color class for date based on urgency
 */
export function getDateColorClass(date: string | Date | null): string {
  if (!date) return "";

  if (isDateOverdue(date)) return "text-destructive";
  if (isDueSoon(date)) return "text-amber-500";
  if (isToday(date)) return "text-primary";

  return "text-muted-foreground";
}

/**
 * Group dates by week
 */
export function groupByWeek<T extends { date: string | Date }>(
  items: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  items.forEach((item) => {
    const d = typeof item.date === "string" ? parseISO(item.date) : item.date;
    const weekKey = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");

    if (!grouped.has(weekKey)) {
      grouped.set(weekKey, []);
    }

    grouped.get(weekKey)!.push(item);
  });

  return grouped;
}
