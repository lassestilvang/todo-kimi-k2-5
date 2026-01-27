/**
 * App State Provider
 * Combined context provider for app-wide state management
 * Includes: selected task, view state, sidebar state
 */

"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { TaskView } from "@/lib/types";

// ============================================================================
// SELECTED TASK CONTEXT
// ============================================================================

interface SelectedTaskState {
  selectedTaskId: number | null;
  isDetailOpen: boolean;
  viewMode: "split" | "modal";
}

interface SelectedTaskContextValue extends SelectedTaskState {
  selectTask: (taskId: number | null) => void;
  closeDetail: () => void;
  setViewMode: (mode: "split" | "modal") => void;
}

const SelectedTaskContext = React.createContext<SelectedTaskContextValue | undefined>(
  undefined
);

export function useSelectedTask() {
  const context = React.useContext(SelectedTaskContext);
  if (!context) {
    throw new Error("useSelectedTask must be used within an AppStateProvider");
  }
  return context;
}

// ============================================================================
// VIEW CONTEXT
// ============================================================================

interface ViewState {
  view: TaskView;
  listId: number | null;
  labelIds: number[];
  showCompleted: boolean;
}

interface ViewContextValue extends ViewState {
  setView: (view: TaskView) => void;
  setListId: (listId: number | null) => void;
  toggleLabel: (labelId: number) => void;
  clearLabels: () => void;
  setShowCompleted: (show: boolean) => void;
  hasActiveFilters: boolean;
}

const ViewContext = React.createContext<ViewContextValue | undefined>(undefined);

export function useView() {
  const context = React.useContext(ViewContext);
  if (!context) {
    throw new Error("useView must be used within an AppStateProvider");
  }
  return context;
}

// ============================================================================
// SIDEBAR CONTEXT
// ============================================================================

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

interface SidebarContextValue extends SidebarState {
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
  closeMobile: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within an AppStateProvider");
  }
  return context;
}

// ============================================================================
// DIALOG CONTEXT
// ============================================================================

interface DialogState {
  isSearchOpen: boolean;
  isCreateTaskOpen: boolean;
  isCreateListOpen: boolean;
  isCreateLabelOpen: boolean;
}

interface DialogContextValue extends DialogState {
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openCreateTask: () => void;
  closeCreateTask: () => void;
  openCreateList: () => void;
  closeCreateList: () => void;
  openCreateLabel: () => void;
  closeCreateLabel: () => void;
  closeAllDialogs: () => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

export function useDialogs() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialogs must be used within an AppStateProvider");
  }
  return context;
}

// ============================================================================
// COMBINED APP STATE PROVIDER
// ============================================================================

interface AppStateProviderProps {
  children: React.ReactNode;
  initialView?: TaskView;
}

export function AppStateProvider({
  children,
  initialView = "today",
}: AppStateProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // -------------------------------------------------------------------------
  // URL State Sync
  // -------------------------------------------------------------------------

  // Initialize from URL params
  const getInitialViewFromURL = (): TaskView => {
    const viewParam = searchParams.get("view");
    const validViews: TaskView[] = ["today", "next7", "upcoming", "all", "completed"];
    if (viewParam && validViews.includes(viewParam as TaskView)) {
      return viewParam as TaskView;
    }
    return initialView;
  };

  const getInitialListIdFromURL = (): number | null => {
    const listParam = searchParams.get("list");
    return listParam ? parseInt(listParam, 10) : null;
  };

  const getInitialLabelIdsFromURL = (): number[] => {
    const labelParams = searchParams.getAll("label");
    return labelParams.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  };

  // -------------------------------------------------------------------------
  // Selected Task State
  // -------------------------------------------------------------------------

  const [selectedTaskId, setSelectedTaskId] = React.useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"split" | "modal">("split");

  // Update view mode based on screen size
  React.useEffect(() => {
    const updateViewMode = () => {
      setViewMode(window.innerWidth >= 1024 ? "split" : "modal");
    };

    updateViewMode();
    window.addEventListener("resize", updateViewMode);
    return () => window.removeEventListener("resize", updateViewMode);
  }, []);

  const selectTask = React.useCallback((taskId: number | null) => {
    setSelectedTaskId(taskId);
    setIsDetailOpen(taskId !== null);
  }, []);

  const closeDetail = React.useCallback(() => {
    setIsDetailOpen(false);
    setSelectedTaskId(null);
  }, []);

  // -------------------------------------------------------------------------
  // View State
  // -------------------------------------------------------------------------

  const [view, setViewState] = React.useState<TaskView>(getInitialViewFromURL);
  const [listId, setListIdState] = React.useState<number | null>(getInitialListIdFromURL);
  const [labelIds, setLabelIds] = React.useState<number[]>(getInitialLabelIdsFromURL);
  const [showCompleted, setShowCompleted] = React.useState(false);

  // Sync state with URL
  const updateURL = React.useCallback(
    (updates: { view?: TaskView; listId?: number | null; labelIds?: number[] }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.view !== undefined) {
        if (updates.view !== "all") {
          params.set("view", updates.view);
        } else {
          params.delete("view");
        }
      }

      if (updates.listId !== undefined) {
        if (updates.listId) {
          params.set("list", updates.listId.toString());
        } else {
          params.delete("list");
        }
      }

      if (updates.labelIds !== undefined) {
        params.delete("label");
        updates.labelIds.forEach((id) => params.append("label", id.toString()));
      }

      const newURL = `${pathname}?${params.toString()}`;
      router.replace(newURL, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setView = React.useCallback(
    (newView: TaskView) => {
      setViewState(newView);
      // Clear list filter when changing views
      if (listId) {
        setListIdState(null);
        updateURL({ view: newView, listId: null });
      } else {
        updateURL({ view: newView });
      }
    },
    [listId, updateURL]
  );

  const setListId = React.useCallback(
    (newListId: number | null) => {
      setListIdState(newListId);
      // Switch to "all" view when selecting a list
      if (newListId) {
        setViewState("all");
        updateURL({ listId: newListId, view: "all" });
      } else {
        updateURL({ listId: newListId });
      }
    },
    [updateURL]
  );

  const toggleLabel = React.useCallback(
    (labelId: number) => {
      setLabelIds((prev) => {
        const newLabelIds = prev.includes(labelId)
          ? prev.filter((id) => id !== labelId)
          : [...prev, labelId];
        updateURL({ labelIds: newLabelIds });
        return newLabelIds;
      });
    },
    [updateURL]
  );

  const clearLabels = React.useCallback(() => {
    setLabelIds([]);
    updateURL({ labelIds: [] });
  }, [updateURL]);

  const hasActiveFilters = React.useMemo(
    () => listId !== null || labelIds.length > 0 || showCompleted,
    [listId, labelIds.length, showCompleted]
  );

  // -------------------------------------------------------------------------
  // Sidebar State
  // -------------------------------------------------------------------------

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const toggleCollapsed = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = React.useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const toggleMobile = React.useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const setMobileOpen = React.useCallback((open: boolean) => {
    setIsMobileOpen(open);
  }, []);

  const closeMobile = React.useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // -------------------------------------------------------------------------
  // Dialog State
  // -------------------------------------------------------------------------

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = React.useState(false);
  const [isCreateLabelOpen, setIsCreateLabelOpen] = React.useState(false);

  const openSearch = React.useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = React.useCallback(() => setIsSearchOpen(false), []);
  const toggleSearch = React.useCallback(
    () => setIsSearchOpen((prev) => !prev),
    []
  );

  const openCreateTask = React.useCallback(() => setIsCreateTaskOpen(true), []);
  const closeCreateTask = React.useCallback(() => setIsCreateTaskOpen(false), []);

  const openCreateList = React.useCallback(() => setIsCreateListOpen(true), []);
  const closeCreateList = React.useCallback(() => setIsCreateListOpen(false), []);

  const openCreateLabel = React.useCallback(() => setIsCreateLabelOpen(true), []);
  const closeCreateLabel = React.useCallback(() => setIsCreateLabelOpen(false), []);

  const closeAllDialogs = React.useCallback(() => {
    setIsSearchOpen(false);
    setIsCreateTaskOpen(false);
    setIsCreateListOpen(false);
    setIsCreateLabelOpen(false);
  }, []);

  // -------------------------------------------------------------------------
  // Context Values
  // -------------------------------------------------------------------------

  const selectedTaskValue = React.useMemo(
    () => ({
      selectedTaskId,
      isDetailOpen,
      viewMode,
      selectTask,
      closeDetail,
      setViewMode,
    }),
    [selectedTaskId, isDetailOpen, viewMode, selectTask, closeDetail]
  );

  const viewValue = React.useMemo(
    () => ({
      view,
      listId,
      labelIds,
      showCompleted,
      setView,
      setListId,
      toggleLabel,
      clearLabels,
      setShowCompleted,
      hasActiveFilters,
    }),
    [
      view,
      listId,
      labelIds,
      showCompleted,
      setView,
      setListId,
      toggleLabel,
      clearLabels,
      hasActiveFilters,
    ]
  );

  const sidebarValue = React.useMemo(
    () => ({
      isCollapsed,
      isMobileOpen,
      toggleCollapsed,
      setCollapsed,
      toggleMobile,
      setMobileOpen,
      closeMobile,
    }),
    [isCollapsed, isMobileOpen]
  );

  const dialogValue = React.useMemo(
    () => ({
      isSearchOpen,
      isCreateTaskOpen,
      isCreateListOpen,
      isCreateLabelOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      openCreateTask,
      closeCreateTask,
      openCreateList,
      closeCreateList,
      openCreateLabel,
      closeCreateLabel,
      closeAllDialogs,
    }),
    [
      isSearchOpen,
      isCreateTaskOpen,
      isCreateListOpen,
      isCreateLabelOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      openCreateTask,
      closeCreateTask,
      openCreateList,
      closeCreateList,
      openCreateLabel,
      closeCreateLabel,
      closeAllDialogs,
    ]
  );

  return (
    <SelectedTaskContext.Provider value={selectedTaskValue}>
      <ViewContext.Provider value={viewValue}>
        <SidebarContext.Provider value={sidebarValue}>
          <DialogContext.Provider value={dialogValue}>
            {children}
          </DialogContext.Provider>
        </SidebarContext.Provider>
      </ViewContext.Provider>
    </SelectedTaskContext.Provider>
  );
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
