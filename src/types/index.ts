export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface Attachment {
  key: string;
  name: string;
  type: string;
  size: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type RepeatPattern = "NONE" | "DAILY" | "WEEKDAYS" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type ReminderType = "NONE" | "ONE_TIME" | "REPEATING";
export type ReminderInterval = "30_MIN" | "1_HOUR" | "2_HOURS" | "3_HOURS" | "4_HOURS" | "CUSTOM";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: Status;
  priority: Priority;
  dueDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  dueTime?: string | null;
  projectId?: string | null;
  assigneeId?: string | null;
  category?: string | null;
  labels?: string[] | null;
  comments?: string[] | null;
  attachments?: Attachment[];
  recurrenceRule?: string | null;
  recurrenceExceptions?: string[] | null;
  originalTodoId?: string | null;
  reminderSetting?: string | null;
  repeat?: RepeatPattern | null;
  reminderType?: ReminderType | null;
  reminderInterval?: ReminderInterval | null;
  customReminderIntervalMinutes?: number | null;
  reminderStartTime?: string | null;
  reminderEndTime?: string | null;
  lastReminderSent?: string | null;
  nextReminderTime?: string | null;
  nextOccurrenceDate?: string | null;
  checklist?: ChecklistItem[] | null;
  notes?: string | null;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTasks {
  items: Task[];
  nextToken?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}
