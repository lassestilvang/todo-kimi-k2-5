/**
 * Home Page - Daily Task Planner
 * Main application page with full integration
 */

"use client";

import * as React from "react";
import { Suspense } from "react";

// Layout Components
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MainContent, MainContentEmpty } from "@/components/layout/MainContent";
import { ViewsSection } from "@/components/layout/ViewsSection";
import { ListsSection } from "@/components/layout/ListsSection";
import { LabelsSection } from "@/components/layout/LabelsSection";

// Task Components
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { TaskDetailDialog } from "@/components/search/SearchDialog";

// Dialog Components
import { CreateTaskDialog } from "@/components/lists/CreateTaskDialog";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { CreateLabelDialog } from "@/components/lists/CreateLabelDialog";
import { SearchDialog } from "@/components/search/SearchDialog";
import type { SearchResult } from "@/components/search/SearchResults";

// Providers & Hooks
import {
  useSelectedTask,
  useView,
  useSidebar,
  useDialogs,
  AppStateProvider,
  AppErrorBoundary,
} from "@/components/providers/AppStateProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useGlobalShortcuts, createAppShortcutHandlers } from "@/lib/utils/keyboard";

// Data Hooks
import {
  useTasksByView,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskCompletion,
} from "@/hooks/useTasks";
import { useLists, useCreateList, useDeleteList } from "@/hooks/useLists";
import { useLabels, useCreateLabel, useDeleteLabel } from "@/hooks/useLabels";
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask, useToggleSubtaskCompletion } from "@/hooks/useSubtasks";
import { useTaskActivity } from "@/hooks/useActivity";

// Types
import type { TaskView, CreateTaskInput } from "@/lib/types";

// Icons
import { Inbox } from "lucide-react";
import { isDateOverdue } from "@/lib/utils/dates";

// ============================================================================
// WRAPPER COMPONENT WITH PROVIDERS
// ============================================================================

export default function HomePage() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<HomePageLoading />}>
        <AppStateProvider initialView="today">
          <HomePageContent />
        </AppStateProvider>
      </Suspense>
    </AppErrorBoundary>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function HomePageLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE CONTENT
// ============================================================================

function HomePageContent() {
  // App State
  const { view, listId, labelIds, showCompleted, setView, setListId, toggleLabel, setShowCompleted } = useView();
  const { selectedTaskId, isDetailOpen, viewMode, selectTask, closeDetail } = useSelectedTask();
  const { isMobileOpen, toggleMobile, closeMobile } = useSidebar();
  const {
    isSearchOpen,
    isCreateTaskOpen,
    isCreateListOpen,
    isCreateLabelOpen,
    openSearch,
    closeSearch,
    openCreateTask,
    closeCreateTask,
    openCreateList,
    closeCreateList,
    openCreateLabel,
    closeCreateLabel,
    closeAllDialogs,
  } = useDialogs();
  const { success, error } = useToast();

  // Data Fetching
  const { data: lists = [], isLoading: listsLoading } = useLists();
  const { data: labels = [], isLoading: labelsLoading } = useLabels();

  // Task data - use view or filter based on selection
  const { data: tasksByView = [], isLoading: tasksLoadingByView } = useTasksByView(
    listId ? "all" : view
  );

  // Filter tasks by list/labels client-side
  const tasks = React.useMemo(() => {
    let filtered = tasksByView;

    // Filter by list
    if (listId) {
      filtered = filtered.filter((t) => t.listId === listId);
    }

    // Filter by labels (note: TaskSummary doesn't have labels directly, this is a placeholder)
    // In a real implementation, you'd fetch tasks with label filter from API
    if (labelIds.length > 0) {
      // This would need API support - for now we show all
    }

    return filtered;
  }, [tasksByView, listId, labelIds]);

  const isLoading = tasksLoadingByView;

  // Selected task data
  const { data: selectedTaskData } = useTask(selectedTaskId || 0);
  const { data: taskActivities } = useTaskActivity(selectedTaskId || 0);
  const { data: taskSubtasks } = useSubtasks(selectedTaskId || 0);

  // Mutations
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleTaskMutation = useToggleTaskCompletion();

  const createListMutation = useCreateList();
  const deleteListMutation = useDeleteList();

  const createLabelMutation = useCreateLabel();
  const deleteLabelMutation = useDeleteLabel();

  const createSubtaskMutation = useCreateSubtask();
  const updateSubtaskMutation = useUpdateSubtask();
  const deleteSubtaskMutation = useDeleteSubtask();
  const toggleSubtaskMutation = useToggleSubtaskCompletion();

  // Search
  const [searchQuery, setSearchQuery] = React.useState("");

  // -------------------------------------------------------------------------
  // Keyboard Shortcuts
  // -------------------------------------------------------------------------

  useGlobalShortcuts(
    createAppShortcutHandlers({
      onSearch: openSearch,
      onNewTask: openCreateTask,
      onClose: () => {
        if (isDetailOpen) closeDetail();
        else closeAllDialogs();
      },
      onToggleSidebar: toggleMobile,
    })
  );

  // Close mobile sidebar on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        closeMobile();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, closeMobile]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleTaskClick = React.useCallback(
    (taskId: number) => {
      selectTask(taskId);
    },
    [selectTask]
  );

  const handleTaskComplete = React.useCallback(
    async (taskId: number, completed: boolean) => {
      try {
        await toggleTaskMutation.mutateAsync(taskId);
        success(completed ? "Task completed" : "Task marked as incomplete");
      } catch (err) {
        error("Failed to update task");
      }
    },
    [toggleTaskMutation, success, error]
  );

  const handleCreateTask = React.useCallback(
    async (data: CreateTaskInput) => {
      try {
        await createTaskMutation.mutateAsync(data);
        success("Task created successfully");
        closeCreateTask();
      } catch (err) {
        error("Failed to create task");
      }
    },
    [createTaskMutation, success, error, closeCreateTask]
  );

  const handleUpdateTask = React.useCallback(
    async (taskId: number, data: Parameters<typeof updateTaskMutation.mutateAsync>[0]["input"]) => {
      try {
        await updateTaskMutation.mutateAsync({ id: taskId, input: data });
      } catch (err) {
        error("Failed to update task");
      }
    },
    [updateTaskMutation, error]
  );

  const handleDeleteTask = React.useCallback(
    async (taskId: number) => {
      try {
        await deleteTaskMutation.mutateAsync(taskId);
        success("Task deleted");
        closeDetail();
      } catch (err) {
        error("Failed to delete task");
      }
    },
    [deleteTaskMutation, success, error, closeDetail]
  );

  const handleCreateList = React.useCallback(
    async (data: Parameters<typeof createListMutation.mutateAsync>[0]) => {
      try {
        await createListMutation.mutateAsync(data);
        success("List created");
        closeCreateList();
      } catch (err) {
        error("Failed to create list");
      }
    },
    [createListMutation, success, error, closeCreateList]
  );

  const handleDeleteList = React.useCallback(
    async (listId: number) => {
      try {
        await deleteListMutation.mutateAsync(listId);
        success("List deleted");
      } catch (err) {
        error("Failed to delete list");
      }
    },
    [deleteListMutation, success, error]
  );

  const handleCreateLabel = React.useCallback(
    async (data: Parameters<typeof createLabelMutation.mutateAsync>[0]) => {
      try {
        await createLabelMutation.mutateAsync(data);
        success("Label created");
        closeCreateLabel();
      } catch (err) {
        error("Failed to create label");
      }
    },
    [createLabelMutation, success, error, closeCreateLabel]
  );

  const handleSearchSelect = React.useCallback(
    (result: SearchResult) => {
      if (result.type === "task") {
        selectTask(result.id);
      } else if (result.type === "list") {
        setListId(result.id);
      } else if (result.type === "label") {
        toggleLabel(result.id);
      }
      closeSearch();
    },
    [selectTask, setListId, toggleLabel, closeSearch]
  );

  // -------------------------------------------------------------------------
  // View Counts (compute from tasks)
  // -------------------------------------------------------------------------

  const viewCounts = React.useMemo(() => {
    return {
      today: tasksByView.filter((t) => {
        const today = new Date().toISOString().split("T")[0];
        return t.taskDate === today && !t.isCompleted;
      }).length,
      next7: tasksByView.filter((t) => {
        if (!t.taskDate || t.isCompleted) return false;
        const today = new Date();
        const taskDate = new Date(t.taskDate);
        const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).length,
      upcoming: tasksByView.filter((t) => t.taskDate && !t.isCompleted).length,
      all: tasksByView.filter((t) => !t.isCompleted).length,
      completed: tasksByView.filter((t) => t.isCompleted).length,
    };
  }, [tasksByView]);

  const overdueCount = React.useMemo(() => {
    return tasksByView.filter((t) => !t.isCompleted && isDateOverdue(t.taskDate)).length;
  }, [tasksByView]);

  // -------------------------------------------------------------------------
  // Get View Title
  // -------------------------------------------------------------------------

  const viewTitle = React.useMemo(() => {
    if (listId) {
      const list = lists.find((l) => l.id === listId);
      return list?.name || "All Tasks";
    }

    const titles: Record<TaskView, string> = {
      today: "Today",
      next7: "Next 7 Days",
      upcoming: "Upcoming",
      all: "All Tasks",
      completed: "Completed",
    };

    return titles[view];
  }, [view, listId, lists]);

  // -------------------------------------------------------------------------
  // Empty State Content
  // -------------------------------------------------------------------------

  const emptyStateContent = React.useMemo(() => {
    const configs: Record<TaskView, { title: string; description: string }> = {
      today: {
        title: "No tasks for today",
        description: "You're all caught up! Enjoy your day.",
      },
      next7: {
        title: "No tasks for the next 7 days",
        description: "Plan ahead by adding tasks for the upcoming week.",
      },
      upcoming: {
        title: "No upcoming tasks",
        description: "Schedule tasks to see them here.",
      },
      all: {
        title: "No tasks yet",
        description: "Create your first task to get started.",
      },
      completed: {
        title: "No completed tasks",
        description: "Complete tasks to see them here.",
      },
    };

    const config = listId
      ? { title: "No tasks in this list", description: "Add tasks to this list to see them here." }
      : configs[view];

    return (
      <MainContentEmpty
        title={config.title}
        description={config.description}
        icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
      />
    );
  }, [view, listId]);

  // ------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <AppShell
        sidebar={
          <div className="flex h-full flex-col">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between p-4 lg:hidden">
              <span className="font-semibold">Task Planner</span>
              <button
                onClick={closeMobile}
                className="rounded-md p-2 hover:bg-accent"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar Content */}
            <Sidebar
              viewsSection={
                <ViewsSection
                  currentView={listId ? "all" : view}
                  onViewChange={setView}
                  counts={viewCounts}
                  overdueCount={overdueCount}
                />
              }
              listsSection={
                <ListsSection
                  lists={lists.map((l) => ({ ...l, taskCount: l.taskCount || 0 }))}
                  selectedListId={listId || undefined}
                  onListSelect={(id) => setListId(id === listId ? null : id)}
                  onListCreate={openCreateList}
                  onListDelete={handleDeleteList}
                  isLoading={listsLoading}
                />
              }
              labelsSection={
                <LabelsSection
                  labels={labels.map((l) => ({ ...l, taskCount: l.taskCount || 0 }))}
                  selectedLabelIds={labelIds}
                  onLabelToggle={toggleLabel}
                  onLabelCreate={openCreateLabel}
                  isLoading={labelsLoading}
                />
              }
            />
          </div>
        }
        mainContent={
          <MainContent
            header={
              <Header
                title={viewTitle}
                taskCount={tasks.length}
                onSearch={(query) => {
                  setSearchQuery(query);
                  if (query) openSearch();
                }}
                onToggleCompleted={() => setShowCompleted(!showCompleted)}
                showCompleted={showCompleted}
                onMenuClick={toggleMobile}
                onAddTask={openCreateTask}
                searchQuery={searchQuery}
              />
            }
            taskDetail={
              viewMode === "split" && isDetailOpen ? (
                <TaskDetail
                  task={selectedTaskData?.task || null}
                  activities={taskActivities}
                  subtasks={taskSubtasks}
                  onClose={closeDetail}
                  onComplete={(completed) =>
                    selectedTaskId && handleTaskComplete(selectedTaskId, completed)
                  }
                  onDelete={handleDeleteTask}
                  onSave={(data) => selectedTaskId && handleUpdateTask(selectedTaskId, data)}
                  onSubtaskAdd={(name) =>
                    selectedTaskId && createSubtaskMutation.mutate({ taskId: selectedTaskId, input: { name } })
                  }
                  onSubtaskToggle={(id, completed) =>
                    toggleSubtaskMutation.mutate(id)
                  }
                  onSubtaskEdit={(id, name) =>
                    updateSubtaskMutation.mutate({ id, input: { name } })
                  }
                  onSubtaskDelete={(id) => deleteSubtaskMutation.mutate(id)}
                />
              ) : undefined
            }
            viewMode={viewMode === "split" && isDetailOpen ? "split" : "list"}
          >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="h-5 w-5 rounded bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="flex gap-2">
                        <div className="h-3 w-16 rounded bg-muted" />
                        <div className="h-3 w-12 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              emptyStateContent
            ) : (
              <TaskList
                tasks={tasks}
                labels={labels}
                selectedTaskId={selectedTaskId}
                onTaskClick={handleTaskClick}
                onTaskComplete={handleTaskComplete}
                showCompleted={showCompleted}
                groupBy={view === "completed" ? "date" : "date"}
              />
            )}
          </MainContent>
        }
      />

      {/* Task Detail Modal (for mobile/tablet) */}
      {viewMode === "modal" && isDetailOpen && (
        <TaskDetailDialog
          isOpen={isDetailOpen}
          onClose={closeDetail}
          taskId={selectedTaskId}
        >
          <TaskDetail
            task={selectedTaskData?.task || null}
            activities={taskActivities}
            subtasks={taskSubtasks}
            onClose={closeDetail}
            onComplete={(completed) =>
              selectedTaskId && handleTaskComplete(selectedTaskId, completed)
            }
            onDelete={handleDeleteTask}
            onSave={(data) => selectedTaskId && handleUpdateTask(selectedTaskId, data)}
            onSubtaskAdd={(name) =>
              selectedTaskId && createSubtaskMutation.mutate({ taskId: selectedTaskId, input: { name } })
            }
            onSubtaskToggle={(id) => toggleSubtaskMutation.mutate(id)}
            onSubtaskEdit={(id, name) => updateSubtaskMutation.mutate({ id, input: { name } })}
            onSubtaskDelete={(id) => deleteSubtaskMutation.mutate(id)}
          />
        </TaskDetailDialog>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onClose={closeCreateTask}
        onSubmit={handleCreateTask}
        lists={lists}
        defaultListId={listId || lists[0]?.id}
        isSubmitting={createTaskMutation.isPending}
      />

      {/* Create List Dialog */}
      <CreateListDialog
        isOpen={isCreateListOpen}
        onClose={closeCreateList}
        onSubmit={handleCreateList}
        isSubmitting={createListMutation.isPending}
      />

      {/* Create Label Dialog */}
      <CreateLabelDialog
        isOpen={isCreateLabelOpen}
        onClose={closeCreateLabel}
        onSubmit={handleCreateLabel}
        isSubmitting={createLabelMutation.isPending}
      />

      {/* Search Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelect={handleSearchSelect}
        onSearch={async (query) => {
          // Return formatted search results
          const results: SearchResult[] = [];

          // Search tasks
          const matchingTasks = tasksByView
            .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
            .map((t) => ({
              type: "task" as const,
              id: t.id,
              title: t.name,
              isCompleted: t.isCompleted,
              listName: t.listName,
              listColor: t.listColor,
              labels: [],
              dueDate: t.taskDate,
              priority: t.priority,
              score: 1,
            }));

          // Search lists
          const matchingLists = lists
            .filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
            .map((l) => ({
              type: "list" as const,
              id: l.id,
              name: l.name,
              emoji: l.emoji,
              color: l.color,
              taskCount: l.taskCount || 0,
              score: 1,
            }));

          // Search labels
          const matchingLabels = labels
            .filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
            .map((l) => ({
              type: "label" as const,
              id: l.id,
              name: l.name,
              color: l.color,
              taskCount: l.taskCount || 0,
              score: 1,
            }));

          return [...matchingTasks, ...matchingLists, ...matchingLabels];
        }}
      />
    </>
  );
}
