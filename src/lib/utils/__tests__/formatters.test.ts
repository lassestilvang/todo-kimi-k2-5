/**
 * Formatters Utility Tests
 * Tests duration, file size, and other formatters
 */

import { describe, test, expect } from "bun:test";
import {
  formatDuration,
  formatTime12Hour,
  formatTime24Hour,
  minutesToHHMM,
  hhmmToMinutes,
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatTaskCount,
  truncateText,
  capitalize,
  formatPriority,
  formatRecurrence,
  formatColor,
  getInitials,
  formatSearchHighlight,
  formatEmoji,
  formatRelativeTime,
} from "../formatters";

describe("Formatters Utilities", () => {
  describe("formatDuration", () => {
    test("should format minutes only", () => {
      expect(formatDuration(45)).toBe("45m");
    });

    test("should format hours only", () => {
      expect(formatDuration(120)).toBe("2h");
    });

    test("should format hours and minutes", () => {
      expect(formatDuration(150)).toBe("2h 30m");
    });

    test("should handle zero", () => {
      expect(formatDuration(0)).toBe("0m");
    });
  });

  describe("formatTime12Hour", () => {
    test("should format to 12-hour with AM", () => {
      expect(formatTime12Hour("09:30")).toContain("AM");
    });

    test("should format to 12-hour with PM", () => {
      expect(formatTime12Hour("14:30")).toContain("PM");
    });

    test("should return empty string for null", () => {
      expect(formatTime12Hour(null)).toBe("");
    });
  });

  describe("formatTime24Hour", () => {
    test("should return time as-is", () => {
      expect(formatTime24Hour("14:30")).toBe("14:30");
    });

    test("should return empty string for null", () => {
      expect(formatTime24Hour(null)).toBe("");
    });
  });

  describe("minutesToHHMM", () => {
    test("should convert minutes to HH:MM", () => {
      expect(minutesToHHMM(90)).toBe("01:30");
      expect(minutesToHHMM(150)).toBe("02:30");
    });

    test("should pad single digits", () => {
      expect(minutesToHHMM(5)).toBe("00:05");
      expect(minutesToHHMM(65)).toBe("01:05");
    });
  });

  describe("hhmmToMinutes", () => {
    test("should convert HH:MM to minutes", () => {
      expect(hhmmToMinutes("01:30")).toBe(90);
      expect(hhmmToMinutes("02:30")).toBe(150);
    });

    test("should handle zero", () => {
      expect(hhmmToMinutes("00:00")).toBe(0);
    });
  });

  describe("formatFileSize", () => {
    test("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
    });

    test("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    test("should format megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
    });

    test("should format gigabytes", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    });

    test("should handle zero", () => {
      expect(formatFileSize(0)).toBe("0 B");
    });
  });

  describe("formatNumber", () => {
    test("should add thousands separators", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1000000)).toBe("1,000,000");
    });

    test("should handle small numbers", () => {
      expect(formatNumber(42)).toBe("42");
    });
  });

  describe("formatPercentage", () => {
    test("should format with default 0 decimals", () => {
      expect(formatPercentage(50.5)).toBe("50%");
    });

    test("should format with custom decimals", () => {
      expect(formatPercentage(50.567, 2)).toBe("50.57%");
      expect(formatPercentage(50.567, 1)).toBe("50.6%");
    });
  });

  describe("formatTaskCount", () => {
    test("should format single task", () => {
      expect(formatTaskCount(1)).toBe("1 task");
    });

    test("should format multiple tasks", () => {
      expect(formatTaskCount(5)).toBe("5 tasks");
    });

    test("should return just word when includeCount is false", () => {
      expect(formatTaskCount(1, false)).toBe("task");
      expect(formatTaskCount(5, false)).toBe("tasks");
    });
  });

  describe("truncateText", () => {
    test("should not truncate short text", () => {
      expect(truncateText("Hello", 10)).toBe("Hello");
    });

    test("should truncate long text", () => {
      const long = "This is a very long text that needs truncation";
      const result = truncateText(long, 10);
      expect(result.endsWith("...")).toBe(true);
      expect(result.length).toBeLessThanOrEqual(14); // 10 + "..."
    });
  });

  describe("capitalize", () => {
    test("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("world")).toBe("World");
    });

    test("should return empty string for empty input", () => {
      expect(capitalize("")).toBe("");
    });
  });

  describe("formatPriority", () => {
    test("should format known priorities", () => {
      expect(formatPriority("high")).toBe("High");
      expect(formatPriority("medium")).toBe("Medium");
      expect(formatPriority("low")).toBe("Low");
      expect(formatPriority("none")).toBe("No priority");
    });

    test("should capitalize unknown priorities", () => {
      expect(formatPriority("custom")).toBe("Custom");
    });
  });

  describe("formatRecurrence", () => {
    test("should format daily", () => {
      expect(formatRecurrence("daily")).toBe("Daily");
      expect(formatRecurrence("daily", 2)).toBe("Every 2 days");
    });

    test("should format weekly", () => {
      expect(formatRecurrence("weekly")).toBe("Weekly");
      expect(formatRecurrence("weekly", 2)).toBe("Every 2 weeks");
    });

    test("should format monthly", () => {
      expect(formatRecurrence("monthly")).toBe("Monthly");
      expect(formatRecurrence("monthly", 3)).toBe("Every 3 months");
    });

    test("should format yearly", () => {
      expect(formatRecurrence("yearly")).toBe("Yearly");
      expect(formatRecurrence("yearly", 2)).toBe("Every 2 years");
    });
  });

  describe("formatColor", () => {
    test("should return hex color as-is", () => {
      expect(formatColor("#ff0000")).toBe("#ff0000");
    });

    test("should return named color as-is", () => {
      expect(formatColor("red")).toBe("red");
    });
  });

  describe("getInitials", () => {
    test("should get single initial", () => {
      expect(getInitials("John")).toBe("J");
    });

    test("should get two initials", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    test("should handle maxLength parameter", () => {
      expect(getInitials("John Michael Doe", 1)).toBe("J");
      expect(getInitials("John Michael Doe", 3)).toBe("JMD");
    });

    test("should return empty string for empty input", () => {
      expect(getInitials("")).toBe("");
    });
  });

  describe("formatSearchHighlight", () => {
    test("should wrap match in mark tag", () => {
      const result = formatSearchHighlight("Hello World", "Hello");
      expect(result).toContain("<mark");
      expect(result).toContain("</mark>");
      expect(result).toContain("Hello");
    });

    test("should return original text when no query", () => {
      expect(formatSearchHighlight("Hello", "")).toBe("Hello");
    });

    test("should handle case-insensitive match", () => {
      const result = formatSearchHighlight("Hello World", "hello");
      expect(result).toContain("Hello");
    });
  });

  describe("formatEmoji", () => {
    test("should return emoji when provided", () => {
      expect(formatEmoji("🚀")).toBe("🚀");
    });

    test("should return fallback for null", () => {
      expect(formatEmoji(null)).toBe("📋");
    });

    test("should return custom fallback", () => {
      expect(formatEmoji(null, "📁")).toBe("📁");
    });
  });

  describe("formatRelativeTime", () => {
    test("should format just now", () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe("just now");
    });

    test("should format minutes ago", () => {
      const minutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(minutesAgo)).toBe("5m ago");
    });

    test("should format hours ago", () => {
      const hoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(hoursAgo)).toBe("2h ago");
    });

    test("should format days ago", () => {
      const daysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(daysAgo)).toBe("3d ago");
    });

    test("should format date for old dates", () => {
      const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(old);
      expect(result).not.toContain("ago");
    });
  });
});