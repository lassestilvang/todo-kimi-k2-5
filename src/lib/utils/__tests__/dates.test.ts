/**
 * Date Utility Tests
 * Tests date formatting and relative time functions
 */

import { describe, test, expect } from "bun:test";
import {
  formatRelativeDate,
  formatDisplayDate,
  formatDateFull,
  formatTimeDistance,
  formatDistanceBetween,
  isDateOverdue,
  isDueSoon,
  getWeekRange,
  getMonthRange,
  getTodayString,
  toDateString,
  parseDate,
  formatDateForAPI,
  formatDateRange,
  getDateColorClass,
} from "../dates";
import { format, addDays, subDays } from "date-fns";

describe("Date Utilities", () => {
  describe("formatRelativeDate", () => {
    test("should return 'Today' for today's date", () => {
      const today = format(new Date(), "yyyy-MM-dd");
      expect(formatRelativeDate(today)).toBe("Today");
    });

    test("should return 'Tomorrow' for tomorrow's date", () => {
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
      expect(formatRelativeDate(tomorrow)).toBe("Tomorrow");
    });

    test("should return 'Yesterday' for yesterday's date", () => {
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
      expect(formatRelativeDate(yesterday)).toBe("Yesterday");
    });

    test("should return formatted date for other dates", () => {
      const nextWeek = addDays(new Date(), 7);
      const result = formatRelativeDate(nextWeek);
      expect(result).not.toBe("Today");
      expect(result).not.toBe("Tomorrow");
      expect(result).not.toBe("Yesterday");
      expect(typeof result).toBe("string");
    });

    test("should return 'No date' for null", () => {
      expect(formatRelativeDate(null)).toBe("No date");
    });

    test("should accept Date object", () => {
      expect(formatRelativeDate(new Date())).toBe("Today");
    });
  });

  describe("formatDisplayDate", () => {
    test("should format date without year for current year", () => {
      const today = new Date();
      const result = formatDisplayDate(today);
      expect(result).not.toContain(today.getFullYear().toString());
    });

    test("should include year for different year", () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const result = formatDisplayDate(lastYear);
      expect(result).toContain(lastYear.getFullYear().toString());
    });

    test("should return empty string for null", () => {
      expect(formatDisplayDate(null)).toBe("");
    });
  });

  describe("formatDateFull", () => {
    test("should return full date format", () => {
      const date = new Date(2025, 0, 15); // Jan 15, 2025
      const result = formatDateFull(date);
      expect(result).toContain("Wednesday");
      expect(result).toContain("January");
      expect(result).toContain("15");
      expect(result).toContain("2025");
    });

    test("should return empty string for null", () => {
      expect(formatDateFull(null)).toBe("");
    });
  });

  describe("formatTimeDistance", () => {
    test("should return relative time string", () => {
      const pastDate = subDays(new Date(), 2);
      const result = formatTimeDistance(pastDate);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should return empty string for null", () => {
      expect(formatTimeDistance(null)).toBe("");
    });
  });

  describe("formatDistanceBetween", () => {
    test("should return distance between two dates", () => {
      const date1 = new Date(2025, 0, 1);
      const date2 = new Date(2025, 0, 10);
      const result = formatDistanceBetween(date1, date2);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should accept string dates", () => {
      const result = formatDistanceBetween("2025-01-01", "2025-01-10");
      expect(typeof result).toBe("string");
    });
  });

  describe("isDateOverdue", () => {
    test("should return true for past dates", () => {
      const pastDate = format(subDays(new Date(), 1), "yyyy-MM-dd");
      expect(isDateOverdue(pastDate)).toBe(true);
    });

    test("should return false for today", () => {
      const today = format(new Date(), "yyyy-MM-dd");
      expect(isDateOverdue(today)).toBe(false);
    });

    test("should return false for future dates", () => {
      const futureDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
      expect(isDateOverdue(futureDate)).toBe(false);
    });

    test("should return false for null", () => {
      expect(isDateOverdue(null)).toBe(false);
    });
  });

  describe("isDueSoon", () => {
    test("should return true for dates within 3 days", () => {
      const soon = format(addDays(new Date(), 2), "yyyy-MM-dd");
      expect(isDueSoon(soon)).toBe(true);
    });

    test("should return false for overdue dates", () => {
      const overdue = format(subDays(new Date(), 1), "yyyy-MM-dd");
      expect(isDueSoon(overdue)).toBe(false);
    });

    test("should return false for dates more than 3 days away", () => {
      const far = format(addDays(new Date(), 5), "yyyy-MM-dd");
      expect(isDueSoon(far)).toBe(false);
    });

    test("should return false for null", () => {
      expect(isDueSoon(null)).toBe(false);
    });
  });

  describe("getWeekRange", () => {
    test("should return start and end of week", () => {
      const range = getWeekRange();
      expect(range).toHaveProperty("start");
      expect(range).toHaveProperty("end");
      expect(range.start instanceof Date).toBe(true);
      expect(range.end instanceof Date).toBe(true);
    });

    test("should accept custom date", () => {
      const customDate = new Date(2025, 0, 15);
      const range = getWeekRange(customDate);
      expect(range.start instanceof Date).toBe(true);
      expect(range.end instanceof Date).toBe(true);
    });
  });

  describe("getMonthRange", () => {
    test("should return start and end of month", () => {
      const range = getMonthRange();
      expect(range).toHaveProperty("start");
      expect(range).toHaveProperty("end");
      expect(range.start instanceof Date).toBe(true);
      expect(range.end instanceof Date).toBe(true);
    });
  });

  describe("getTodayString", () => {
    test("should return today in YYYY-MM-DD format", () => {
      const today = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(today).toBe(format(new Date(), "yyyy-MM-dd"));
    });
  });

  describe("toDateString", () => {
    test("should convert Date to YYYY-MM-DD", () => {
      const date = new Date(2025, 0, 15);
      expect(toDateString(date)).toBe("2025-01-15");
    });

    test("should convert string date to YYYY-MM-DD", () => {
      expect(toDateString("2025-01-15")).toBe("2025-01-15");
    });
  });

  describe("parseDate", () => {
    test("should parse valid date string", () => {
      const result = parseDate("2025-01-15");
      expect(result instanceof Date).toBe(true);
      expect(result?.getFullYear()).toBe(2025);
    });

    test("should return null for invalid date", () => {
      expect(parseDate("invalid")).toBeNull();
    });

    test("should return null for empty string", () => {
      expect(parseDate("")).toBeNull();
    });
  });

  describe("formatDateForAPI", () => {
    test("should format Date to YYYY-MM-DD", () => {
      const date = new Date(2025, 0, 15);
      expect(formatDateForAPI(date)).toBe("2025-01-15");
    });

    test("should format string to YYYY-MM-DD", () => {
      expect(formatDateForAPI("2025-01-15T10:30:00")).toBe("2025-01-15");
    });

    test("should return null for null input", () => {
      expect(formatDateForAPI(null)).toBeNull();
    });
  });

  describe("formatDateRange", () => {
    test("should format range with two dates", () => {
      const result = formatDateRange("2025-01-01", "2025-01-10");
      expect(typeof result).toBe("string");
      expect(result).toContain("-");
    });

    test("should return single date when start equals end", () => {
      const result = formatDateRange("2025-01-15", "2025-01-15");
      expect(result).not.toContain(" - ");
    });

    test("should return 'Any time' for null dates", () => {
      expect(formatDateRange(null, null)).toBe("Any time");
    });
  });

  describe("getDateColorClass", () => {
    test("should return overdue class for past dates", () => {
      const past = format(subDays(new Date(), 1), "yyyy-MM-dd");
      expect(getDateColorClass(past)).toBe("text-destructive");
    });

    test("should return primary class for today", () => {
      const today = format(new Date(), "yyyy-MM-dd");
      expect(getDateColorClass(today)).toBe("text-primary");
    });

    test("should return due-soon class for dates within 3 days", () => {
      const soon = format(addDays(new Date(), 2), "yyyy-MM-dd");
      expect(getDateColorClass(soon)).toBe("text-amber-500");
    });

    test("should return muted class for other dates", () => {
      const far = format(addDays(new Date(), 10), "yyyy-MM-dd");
      expect(getDateColorClass(far)).toBe("text-muted-foreground");
    });

    test("should return empty string for null", () => {
      expect(getDateColorClass(null)).toBe("");
    });
  });
});