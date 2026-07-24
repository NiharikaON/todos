import { Task, Status, Priority, Project } from "@/types";
import { StorageFile } from "@/types/storage";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  preferences?: Record<string, boolean>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<User>;
  register(email: string, password: string, name?: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, code: string, newPassword: string): Promise<void>;
  confirmSignUp(email: string, code: string): Promise<void>;
  resendConfirmationCode(email: string): Promise<void>;
  setupMFA(): Promise<string>;
  verifyMFA(code: string): Promise<void>;
  refreshSession(): Promise<User | null>;
  updateProfile(name: string): Promise<void>;
  updateAvatar(url: string): Promise<void>;
  updatePassword(oldPassword: string, newPassword: string): Promise<void>;
  updatePreferences(preferences: Record<string, boolean>): Promise<void>;
}

export interface ITodoRepository {
  getTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}

export interface IProjectRepository {
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project>;
  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
}

export interface IStorageRepository {
  uploadFile(file: File, entityType: string, entityId: string, onProgress?: (progress: number) => void): Promise<StorageFile>;
  deleteFile(fileKey: string): Promise<void>;
  getFileUrl(fileKey: string): Promise<string>;
  listFiles(entityType: string, entityId: string): Promise<StorageFile[]>;
}

import { AppEvent, AuditLogEntry } from "@/types/events";

export interface IEventPublisher {
  publish(event: AppEvent): Promise<void>;
  publishBatch(events: AppEvent[]): Promise<void>;
}

export interface INotificationService {
  send(userId: string, notification: Omit<Notification, "id" | "createdAt" | "read">): Promise<void>;
  getNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}

export interface IAuditLogRepository {
  log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void>;
  getAuditLogs(entityType: string, entityId: string): Promise<AuditLogEntry[]>;
}
