/**
 * Components Index
 * Export all components from subdirectories
 */

// Layout Components
export * from "./layout";

// UI Components (shadcn) - export individually to avoid conflicts
export { Button, buttonVariants } from "./ui/button";
export { Badge, badgeVariants } from "./ui/badge";
export { Calendar } from "./ui/calendar";
export { Checkbox } from "./ui/checkbox";
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
export { Input } from "./ui/input";
export { Label } from "./ui/label";
export { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
export { ScrollArea } from "./ui/scroll-area";
export { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
export { Separator } from "./ui/separator";
export { Skeleton } from "./ui/skeleton";
export { Switch } from "./ui/switch";
export { Textarea } from "./ui/textarea";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// Task Components
export * from "./tasks";

// Form Components - export individually to avoid conflicts
export {
  TaskForm, TaskFormCompact,
  DatePicker, DatePickerCompact,
  TimePicker, TimePickerCompact,
  PrioritySelect, PriorityButtonGroup,
  LabelPicker, LabelBadge, LabelPickerCompact,
  RecurrencePicker, RecurrenceToggle,
  EmojiPicker, EmojiPickerCompact,
  ColorPicker, ColorPickerInline, ColorDot,
} from "./forms";

// List/Dialog Components
export {
  CreateTaskDialog,
  CreateListDialog,
  EditListDialog,
  CreateLabelDialog, EditLabelDialog,
  ConfirmDialog, AlertDialog,
} from "./lists";

// Search Components
export * from "./search";

// Providers
export { QueryProvider } from "./providers/QueryProvider";
export { ThemeProvider } from "./providers/ThemeProvider";
export {
  ToastProvider,
  useToast,
  useSuccessToast,
  useErrorToast,
  useActionToast,
} from "./providers/ToastProvider";
export {
  AppStateProvider,
  AppErrorBoundary,
  useSelectedTask,
  useView,
  useSidebar,
  useDialogs,
} from "./providers/AppStateProvider";
