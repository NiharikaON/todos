// ─── Repository Factory ──────────────────────────────────────────────────────
// Central entry point for all repository instances.
// Uses feature flags to decide between mock and AWS implementations.
// Lazy-initializes singletons for performance.

import { FeatureFlags } from "@/config/featureFlags";
import {
  IAuthRepository,
  ITodoRepository,
  IProjectRepository,
  IStorageRepository,
  IEventPublisher,
  INotificationService,
  IAuditLogRepository,
} from "@/repositories/interfaces";

// ─── Singleton Cache ─────────────────────────────────────────────────────────

let _authRepository: IAuthRepository | null = null;
let _todoRepository: ITodoRepository | null = null;
let _projectRepository: IProjectRepository | null = null;
let _storageRepository: IStorageRepository | null = null;
let _eventPublisher: IEventPublisher | null = null;
let _notificationService: INotificationService | null = null;
let _auditLogRepository: IAuditLogRepository | null = null;

// ─── Factory Functions ───────────────────────────────────────────────────────

export function getAuthRepository(): IAuthRepository {
  if (!_authRepository) {
    if (FeatureFlags.USE_AWS_AUTH) {
      // Lazy import to avoid loading AWS SDK when not needed
      const { amplifyAuthRepository } = require("@/repositories/aws/AmplifyAuthRepository");
      _authRepository = amplifyAuthRepository;
    } else {
      const { authRepository } = require("@/repositories/mocks/MockAuthRepository");
      _authRepository = authRepository;
    }
  }
  return _authRepository!;
}

export function getTodoRepository(): ITodoRepository {
  if (!_todoRepository) {
    if (FeatureFlags.USE_AWS_DATA) {
      const { todoGraphQLRepository } = require("@/repositories/graphql/TodoGraphQLRepository");
      _todoRepository = todoGraphQLRepository;
    } else {
      const { todoRepository } = require("@/repositories/mocks/MockTodoRepository");
      _todoRepository = todoRepository;
    }
  }
  return _todoRepository!;
}

export function getProjectRepository(): IProjectRepository {
  if (!_projectRepository) {
    if (FeatureFlags.USE_AWS_DATA) {
      const { projectGraphQLRepository } = require("@/repositories/graphql/ProjectGraphQLRepository");
      _projectRepository = projectGraphQLRepository;
    } else {
      const { projectRepository } = require("@/repositories/mocks/MockProjectRepository");
      _projectRepository = projectRepository;
    }
  }
  return _projectRepository!;
}

export function getStorageRepository(): IStorageRepository {
  if (!_storageRepository) {
    if (FeatureFlags.USE_AWS_STORAGE) {
      const { amplifyStorageRepository } = require("@/repositories/aws/AmplifyStorageRepository");
      _storageRepository = amplifyStorageRepository;
    } else {
      const { mockStorageRepository } = require("@/repositories/mocks/MockStorageRepository");
      _storageRepository = mockStorageRepository;
    }
  }
  return _storageRepository!;
}

export function getEventPublisher(): IEventPublisher {
  if (!_eventPublisher) {
    if (FeatureFlags.USE_AWS_EVENTS) {
      const { eventBridgePublisher } = require("@/repositories/aws/EventBridgePublisher");
      _eventPublisher = eventBridgePublisher;
    } else {
      const { mockEventPublisher } = require("@/repositories/mocks/MockEventPublisher");
      _eventPublisher = mockEventPublisher;
    }
  }
  return _eventPublisher!;
}

export function getNotificationService(): INotificationService {
  if (!_notificationService) {
    if (FeatureFlags.USE_AWS_EVENTS) {
      const { amplifyNotificationService } = require("@/repositories/aws/AmplifyNotificationService");
      _notificationService = amplifyNotificationService;
    } else {
      const { mockNotificationService } = require("@/repositories/mocks/MockNotificationService");
      _notificationService = mockNotificationService;
    }
  }
  return _notificationService!;
}

export function getAuditLogRepository(): IAuditLogRepository {
  if (!_auditLogRepository) {
    if (FeatureFlags.USE_AWS_EVENTS) {
      const { dynamoDBAuditLogRepository } = require("@/repositories/aws/DynamoDBAuditLogRepository");
      _auditLogRepository = dynamoDBAuditLogRepository;
    } else {
      const { mockAuditLogRepository } = require("@/repositories/mocks/MockAuditLogRepository");
      _auditLogRepository = mockAuditLogRepository;
    }
  }
  return _auditLogRepository!;
}

// ─── Convenience Re-exports ──────────────────────────────────────────────────

export const RepositoryFactory = {
  getAuthRepository,
  getTodoRepository,
  getProjectRepository,
  getStorageRepository,
  getEventPublisher,
  getNotificationService,
  getAuditLogRepository,
} as const;
