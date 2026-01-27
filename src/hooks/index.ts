/**
 * Hooks Index
 * Export all custom React hooks
 */

// React Query hooks
export {
  useLists,
  useList,
  useCreateList,
  useUpdateList,
  useDeleteList,
} from "./useLists";

export {
  useTasksByView,
  useTasksWithFilter,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskCompletion,
} from "./useTasks";

export {
  useLabels,
  useLabel,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
} from "./useLabels";

export {
  useSubtasks,
  useSubtask,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useToggleSubtaskCompletion,
} from "./useSubtasks";

export {
  useSearch,
  useTaskSearch,
  useLabelSearch,
  useQuickSearch,
  useSearchSuggestions,
  useAdvancedSearch,
  useSearchInput,
} from "./useSearch";

export {
  useActivity,
  useTaskActivity,
  useActivityByDateRange,
  useActivityStats,
  formatActivityAction,
  getActivityActionIcon,
  formatActivityTime,
} from "./useActivity";

export {
  useTaskFilters,
  getViewInfo,
  getViewDescription,
} from "./useTaskFilters";

// Re-export types
export type { TaskView } from "@/lib/types";
