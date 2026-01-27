/**
 * CreateListDialog Component
 * Dialog for creating new lists
 */

"use client";

import * as React from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmojiPicker } from "@/components/forms/EmojiPicker";
import { ColorPicker } from "@/components/forms/ColorPicker";
import type { CreateListInputType } from "@/lib/validation/schemas";

export interface CreateListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListInputType) => void;
  isSubmitting?: boolean;
  className?: string;
}

const defaultColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
];

export function CreateListDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  className,
}: CreateListDialogProps) {
  const [name, setName] = React.useState("");
  const [emoji, setEmoji] = React.useState("📋");
  const [color, setColor] = React.useState("#6366f1");

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setEmoji("📋");
      setColor("#6366f1");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      emoji,
      color,
      sortOrder: 0,
    });
  };

  const isValid = name.trim().length > 0 && name.trim().length <= 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Create New List
            </DialogTitle>
            <DialogDescription>
              Create a new list to organize your tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* List Name */}
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My List"
                autoFocus
              />
              {name.length > 100 && (
                <p className="text-xs text-destructive">
                  List name must be 100 characters or less
                </p>
              )}
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-3">
                <EmojiPicker value={emoji} onChange={setEmoji} size="md" />
                <span className="text-sm text-muted-foreground">
                  Choose an icon for your list
                </span>
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <ColorPicker
                  value={color}
                  onChange={setColor}
                  presets={defaultColors}
                  size="md"
                />
                <div className="flex-1">
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6366f1"
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Preview
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                  style={{ backgroundColor: `${color}20` }}
                >
                  {emoji}
                </div>
                <div>
                  <p className="font-medium">{name || "My List"}</p>
                  <div
                    className="h-1 w-16 rounded-full mt-1"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
