/**
 * Toast Provider
 * Global toast notification system
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export function ToastProvider({
  children,
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  // Use a ref to store toast IDs pending removal
  const pendingRemovalsRef = React.useRef<Set<string>>(new Set());

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    pendingRemovalsRef.current.delete(id);
  }, []);

  const addToast = React.useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      // Auto-remove toast after duration
      if (duration > 0) {
        pendingRemovalsRef.current.add(id);
        setTimeout(() => {
          if (pendingRemovalsRef.current.has(id)) {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
            pendingRemovalsRef.current.delete(id);
          }
        }, duration);
      }
    },
    [maxToasts]
  );

  const success = React.useCallback(
    (message: string, duration?: number) => {
      addToast(message, "success", duration);
    },
    [addToast]
  );

  const error = React.useCallback(
    (message: string, duration?: number) => {
      addToast(message, "error", duration);
    },
    [addToast]
  );

  const warning = React.useCallback(
    (message: string, duration?: number) => {
      addToast(message, "warning", duration);
    },
    [addToast]
  );

  const info = React.useCallback(
    (message: string, duration?: number) => {
      addToast(message, "info", duration);
    },
    [addToast]
  );

  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, addToast, removeToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// TOAST CONTAINER
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// TOAST ITEM
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const toastStyles: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800",
  error: "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800",
  warning:
    "border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800",
  info: "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800",
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex min-w-[300px] max-w-md items-center gap-3 rounded-lg border p-4 shadow-lg",
        "bg-background",
        toastStyles[toast.type]
      )}
    >
      {toastIcons[toast.type]}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ============================================================================
// TOAST HOOKS FOR COMMON USE CASES
// ============================================================================

/**
 * Hook for showing success toasts
 */
export function useSuccessToast() {
  const { success } = useToast();
  return success;
}

/**
 * Hook for showing error toasts
 */
export function useErrorToast() {
  const { error } = useToast();
  return error;
}

/**
 * Hook for showing action result toasts
 */
export function useActionToast() {
  const { success, error } = useToast();

  return React.useCallback(
    (action: () => Promise<void>, messages?: { success?: string; error?: string }) => {
      action()
        .then(() => {
          if (messages?.success) {
            success(messages.success);
          }
        })
        .catch((err) => {
          error(messages?.error || err.message || "An error occurred");
        });
    },
    [success, error]
  );
}
