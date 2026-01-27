/**
 * Formatting utility functions
 * Time/duration formatting and other formatters
 */

/**
 * Format duration from minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Format time from HH:mm format to 12-hour with AM/PM
 */
export function formatTime12Hour(time: string | null): string {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format time from HH:mm format to 24-hour
 */
export function formatTime24Hour(time: string | null): string {
  if (!time) return "";
  return time;
}

/**
 * Convert minutes to HH:mm format
 */
export function minutesToHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Convert HH:mm format to minutes
 */
export function hhmmToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format number with commas as thousands separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format task count with proper pluralization
 */
export function formatTaskCount(count: number, includeCount = true): string {
  if (!includeCount) {
    return count === 1 ? "task" : "tasks";
  }
  return `${count} ${count === 1 ? "task" : "tasks"}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format priority for display
 */
export function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
    none: "No priority",
  };

  return priorityMap[priority] || capitalize(priority);
}

/**
 * Format recurrence rule for display
 */
export function formatRecurrence(frequency: string, interval = 1): string {
  const frequencyMap: Record<string, string> = {
    daily: interval === 1 ? "Daily" : `Every ${interval} days`,
    weekly: interval === 1 ? "Weekly" : `Every ${interval} weeks`,
    monthly: interval === 1 ? "Monthly" : `Every ${interval} months`,
    yearly: interval === 1 ? "Yearly" : `Every ${interval} years`,
  };

  return frequencyMap[frequency] || capitalize(frequency);
}

/**
 * Format list/label color for display
 */
export function formatColor(color: string): string {
  // If it's a hex color, return as-is
  if (color.startsWith("#")) return color;

  // Otherwise, assume it's a named color and return it
  return color;
}

/**
 * Create initials from a name
 */
export function getInitials(name: string, maxLength = 2): string {
  if (!name) return "";

  const words = name.split(/\s+/);
  const initials = words
    .slice(0, maxLength)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials;
}

/**
 * Format search result with highlighted matches
 */
export function formatSearchHighlight(
  text: string,
  query: string,
  highlightClass = "bg-yellow-200 dark:bg-yellow-900"
): string {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text.replace(regex, `<mark class="${highlightClass}">$1</mark>`);
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Format emoji with fallback
 */
export function formatEmoji(emoji: string | null, fallback = "📋"): string {
  return emoji || fallback;
}

/**
 * Format relative time (e.g., "just now", "2m ago", "1h ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
