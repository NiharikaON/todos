export enum EventType {
  // Todo Events
  TODO_CREATED = "TODO_CREATED",
  TODO_UPDATED = "TODO_UPDATED",
  TODO_DELETED = "TODO_DELETED",
  
  // Project Events
  PROJECT_CREATED = "PROJECT_CREATED",
  PROJECT_UPDATED = "PROJECT_UPDATED",
  PROJECT_DELETED = "PROJECT_DELETED",

  // User Events
  USER_SIGNED_UP = "USER_SIGNED_UP",
  USER_LOGGED_IN = "USER_LOGGED_IN",
  USER_PROFILE_UPDATED = "USER_PROFILE_UPDATED",

  // Storage Events
  FILE_UPLOADED = "FILE_UPLOADED",
  FILE_DELETED = "FILE_DELETED",
}

export interface AppEvent<T = any> {
  id: string;
  type: EventType | string;
  source: string;
  payload: T;
  timestamp: string;
  userId?: string;
  correlationId?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsEvent {
  eventName: string;
  attributes: Record<string, string | number | boolean>;
  metrics?: Record<string, number>;
}
