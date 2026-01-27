/**
 * ColorPicker Component
 * Color selector with presets
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  allowCustom?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

// Default preset colors matching CSS variables
const defaultPresets = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#64748b", // slate
  "#6b7280", // gray
  "#71717a", // zinc
];

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export function ColorPicker({
  value,
  onChange,
  presets = defaultPresets,
  allowCustom = true,
  size = "md",
  disabled = false,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [customColor, setCustomColor] = React.useState(value);

  const handleSelect = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      onChange(color);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "rounded-md border-2 border-transparent ring-offset-background transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            sizeClasses[size],
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          style={{ backgroundColor: value }}
          title={value}
        >
          <span className="sr-only">Select color</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {/* Preset colors */}
        <div className="grid grid-cols-7 gap-1.5">
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleSelect(color)}
              className={cn(
                "h-7 w-7 rounded-md transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                value === color && "ring-2 ring-primary ring-offset-2"
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Custom color input */}
        {allowCustom && (
          <div className="mt-3 border-t pt-3">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 shrink-0 rounded-md border"
                style={{ backgroundColor: customColor }}
              />
              <Input
                type="text"
                value={customColor}
                onChange={handleCustomChange}
                placeholder="#000000"
                className="h-8 font-mono text-sm"
                maxLength={7}
              />
              <input
                type="color"
                value={customColor}
                onChange={handleCustomChange}
                className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 p-0"
              />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Inline compact version
export function ColorPickerInline({
  value,
  onChange,
  presets = defaultPresets.slice(0, 10),
  className,
}: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-6 w-6 rounded-full transition-all hover:scale-110",
            value === color && "ring-2 ring-primary ring-offset-2"
          )}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}

// Color dot display
export function ColorDot({
  color,
  size = "md",
  className,
}: {
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn("inline-block rounded-full", sizeClasses[size], className)}
      style={{ backgroundColor: color }}
    />
  );
}
