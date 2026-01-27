/**
 * HighlightMatch Component
 * Highlight search matches in text
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface HighlightMatchProps {
  text: string;
  matches: Array<{ start: number; end: number }>;
  highlightClassName?: string;
  className?: string;
}

export function HighlightMatch({
  text,
  matches,
  highlightClassName = "bg-yellow-200 dark:bg-yellow-900/50",
  className,
}: HighlightMatchProps) {
  // Sort matches by start position
  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

  // Merge overlapping matches
  const mergedMatches: Array<{ start: number; end: number }> = [];
  sortedMatches.forEach((match) => {
    const lastMatch = mergedMatches[mergedMatches.length - 1];
    if (lastMatch && match.start <= lastMatch.end) {
      // Merge overlapping matches
      lastMatch.end = Math.max(lastMatch.end, match.end);
    } else {
      mergedMatches.push({ ...match });
    }
  });

  // Build highlighted text
  const parts: Array<{ text: string; isMatch: boolean }> = [];
  let lastEnd = 0;

  mergedMatches.forEach((match) => {
    // Add text before match
    if (match.start > lastEnd) {
      parts.push({
        text: text.slice(lastEnd, match.start),
        isMatch: false,
      });
    }
    // Add matched text
    parts.push({
      text: text.slice(match.start, match.end),
      isMatch: true,
    });
    lastEnd = match.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    parts.push({
      text: text.slice(lastEnd),
      isMatch: false,
    });
  }

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <span
          key={index}
          className={part.isMatch ? highlightClassName : undefined}
        >
          {part.text}
        </span>
      ))}
    </span>
  );
}

// Simple version that just highlights all occurrences of a query
export function HighlightQuery({
  text,
  query,
  highlightClassName = "bg-yellow-200 dark:bg-yellow-900/50",
  className,
}: {
  text: string;
  query: string;
  highlightClassName?: string;
  className?: string;
}) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === query.toLowerCase();
        return (
          <span
            key={index}
            className={isMatch ? highlightClassName : undefined}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
