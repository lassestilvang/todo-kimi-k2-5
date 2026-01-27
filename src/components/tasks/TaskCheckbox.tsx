/**
 * TaskCheckbox Component
 * Animated completion toggle with Framer Motion
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    box: "h-4 w-4",
    icon: "h-2.5 w-2.5",
    stroke: 2,
  },
  md: {
    box: "h-5 w-5",
    icon: "h-3 w-3",
    stroke: 2.5,
  },
  lg: {
    box: "h-6 w-6",
    icon: "h-4 w-4",
    stroke: 3,
  },
};

export function TaskCheckbox({
  checked,
  onChange,
  size = "md",
  isLoading = false,
  className,
}: TaskCheckboxProps) {
  const config = sizeConfig[size];
  const [isPressed, setIsPressed] = React.useState(false);

  const handleClick = () => {
    if (isLoading) return;
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={isLoading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        config.box,
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/30 bg-transparent hover:border-muted-foreground/50",
        isLoading && "cursor-not-allowed opacity-50",
        className
      )}
      tabIndex={0}
    >
      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          >
            <Check
              className={cn(config.icon, "text-primary-foreground")}
              strokeWidth={config.stroke}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple effect on check */}
      <AnimatePresence>
        {checked && isPressed && (
          <motion.span
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-md bg-primary/30"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Circular variant for subtasks or alternative style
export function TaskCheckboxCircle({
  checked,
  onChange,
  size = "md",
  isLoading = false,
  className,
}: TaskCheckboxProps) {
  const config = sizeConfig[size];

  const handleClick = () => {
    if (isLoading) return;
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={isLoading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        config.box,
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/30 bg-transparent hover:border-muted-foreground/50",
        isLoading && "cursor-not-allowed opacity-50",
        className
      )}
      tabIndex={0}
    >
      <AnimatePresence mode="wait">
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          >
            <Check
              className={cn(config.icon, "text-primary-foreground")}
              strokeWidth={config.stroke}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
