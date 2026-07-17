import { IAuditLogRepository } from "@/repositories/interfaces";
import { AuditLogEntry } from "@/types/events";
import { v4 as uuidv4 } from "uuid";

export class MockAuditLogRepository implements IAuditLogRepository {
  private logs: AuditLogEntry[] = [];

  async log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    
    console.log("[MockAuditLogRepository] Logging entry:", fullEntry);
    this.logs.push(fullEntry);
  }

  async getAuditLogs(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    return this.logs
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const mockAuditLogRepository = new MockAuditLogRepository();
