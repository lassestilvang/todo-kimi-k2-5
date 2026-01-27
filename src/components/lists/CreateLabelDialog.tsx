/**
 * CreateLabelDialog Component
 * Dialog for creating new labels
 */

"use client";

import * as React from "react";
import { Tag, Trash2 } from "lucide-react";
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
import { ColorPicker } from "@/components/forms/ColorPicker";
import { ConfirmDialog } from "./ConfirmDialog";
import type { CreateLabelInputType, UpdateLabelInputType } from "@/lib/validation/schemas";
import type { Label as LabelType } from "@/lib/types";

export interface CreateLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLabelInputType) => void;
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

export function CreateLabelDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  className,
}: CreateLabelDialogProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#8b5cf6");

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setColor("#8b5cf6");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      color,
      icon: "tag",
    });
  };

  const isValid = name.trim().length > 0 && name.trim().length <= 50;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Create New Label
            </DialogTitle>
            <DialogDescription>
              Create a label to categorize your tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Label Name */}
            <div className="space-y-2">
              <Label htmlFor="label-name">Label Name</Label>
              <Input
                id="label-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work, Personal, Urgent"
                autoFocus
              />
              {name.length > 50 && (
                <p className="text-xs text-destructive">
                  Label name must be 50 characters or less
                </p>
              )}
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
                    placeholder="#8b5cf6"
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
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                <Tag className="mr-1.5 h-3 w-3" />
                {name || "Label Name"}
              </span>
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
              {isSubmitting ? "Creating..." : "Create Label"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Label Dialog
export interface EditLabelDialogProps {
  label: LabelType | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateLabelInputType) => void;
  onDelete?: (labelId: number) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function EditLabelDialog({
  label,
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting = false,
  className,
}: EditLabelDialogProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#8b5cf6");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Load label data when dialog opens
  React.useEffect(() => {
    if (label && isOpen) {
      setName(label.name);
      setColor(label.color);
    }
  }, [label, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !name.trim()) return;

    const updates: UpdateLabelInputType = {};
    if (name.trim() !== label.name) updates.name = name.trim();
    if (color !== label.color) updates.color = color;

    if (Object.keys(updates).length > 0) {
      onSubmit(updates);
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    if (label && onDelete) {
      onDelete(label.id);
      setShowDeleteConfirm(false);
    }
  };

  const isValid = name.trim().length > 0 && name.trim().length <= 50;
  const hasChanges =
    label && (name.trim() !== label.name || color !== label.color);

  if (!label) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={cn("sm:max-w-md", className)}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Edit Label
              </DialogTitle>
              <DialogDescription>
                Modify your label settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Label Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-label-name">Label Name</Label>
                <Input
                  id="edit-label-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Work, Personal, Urgent"
                  autoFocus
                />
                {name.length > 50 && (
                  <p className="text-xs text-destructive">
                    Label name must be 50 characters or less
                  </p>
                )}
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
                      placeholder="#8b5cf6"
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
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  <Tag className="mr-1.5 h-3 w-3" />
                  {name || "Label Name"}
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2">
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || (!hasChanges && !isSubmitting)}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Label"
        description={`Are you sure you want to delete "${label.name}"? This will remove the label from all tasks. This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={isSubmitting}
      />
    </>
  );
}
