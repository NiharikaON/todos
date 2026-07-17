// ─── Centralized Repository Exports ──────────────────────────────────────────
// All UI components should import repositories from this file.
// The factory handles mock vs. AWS selection based on feature flags.

import {
  getAuthRepository,
  getTodoRepository,
  getProjectRepository,
  getStorageRepository,
  getEventPublisher,
  getNotificationService,
  getAuditLogRepository,
} from "@/factories/RepositoryFactory";

export const authRepository = getAuthRepository();
export const todoRepository = getTodoRepository();
export const projectRepository = getProjectRepository();
export const storageRepository = getStorageRepository();
export const eventPublisher = getEventPublisher();
export const notificationService = getNotificationService();
export const auditLogRepository = getAuditLogRepository();

// Re-export interfaces for convenience
export type {
  IAuthRepository,
  ITodoRepository,
  IProjectRepository,
  IStorageRepository,
  IEventPublisher,
  INotificationService,
  IAuditLogRepository,
  User,
  Notification,
} from "./interfaces";
