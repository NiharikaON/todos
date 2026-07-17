import { IAuditLogRepository } from "@/repositories/interfaces";
import { AuditLogEntry } from "@/types/events";
import { generateClient } from "aws-amplify/api";


export class DynamoDBAuditLogRepository implements IAuditLogRepository {
  async log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
    console.warn("[DynamoDBAuditLogRepository] DynamoDB audit log table not configured. Entry:", entry);
    throw new Error("DynamoDBAuditLogRepository not implemented");
  }

  async getAuditLogs(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    console.warn("[DynamoDBAuditLogRepository] Cannot fetch audit logs. Table not configured.");
    return [];
  }
}

export const dynamoDBAuditLogRepository = new DynamoDBAuditLogRepository();
