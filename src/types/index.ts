export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface Attachment {
  key: string;
  name: string;
  type: string;
  size: number;
}

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
