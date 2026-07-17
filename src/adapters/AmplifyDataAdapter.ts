import { Task, Project } from "@/types";

export class AmplifyDataAdapter {
  static mapAppSyncTodoToTask(appSyncTodo: any): Task {
    return {
      id: appSyncTodo.id,
      userId: appSyncTodo.userId,
      title: appSyncTodo.title,
      description: appSyncTodo.description || null,
      status: appSyncTodo.status as "PENDING" | "IN_PROGRESS" | "COMPLETED",
      priority: appSyncTodo.priority as "LOW" | "MEDIUM" | "HIGH",
      category: appSyncTodo.projectId ? "Project" : (
        appSyncTodo.labels?.find((l: string) => ["Personal", "Work", "Shopping", "Health", "Finance", "Other"].includes(l)) || "Personal"
      ),
      dueDate: appSyncTodo.dueDate || null,
      startDate: appSyncTodo.startDate || null,
      endDate: appSyncTodo.endDate || null,
      projectId: appSyncTodo.projectId || null,
      assigneeId: appSyncTodo.assigneeId || null,
      labels: appSyncTodo.labels || null,
      comments: appSyncTodo.comments || null,
      attachments: appSyncTodo.attachments || [],
      recurrenceRule: appSyncTodo.recurrenceRule || null,
      recurrenceExceptions: appSyncTodo.recurrenceExceptions || null,
      originalTodoId: appSyncTodo.originalTodoId || null,
      reminderSetting: appSyncTodo.reminderSetting || null,
      createdAt: appSyncTodo.createdAt || new Date().toISOString(),
      updatedAt: appSyncTodo.updatedAt || new Date().toISOString(),
    };
  }

  static mapAppSyncProjectToProject(appSyncProject: any): Project {
    return {
      id: appSyncProject.id,
      name: appSyncProject.name,
      description: appSyncProject.description || "",
      ownerId: appSyncProject.ownerId,
      createdAt: appSyncProject.createdAt || new Date().toISOString(),
      updatedAt: appSyncProject.updatedAt || new Date().toISOString(),
      attachments: appSyncProject.attachments || [],
    };
  }

  static mapError(error: unknown, defaultMessage: string): Error {
    console.error("Amplify Error:", error);
    
    // Check for GraphQL errors structure
    if (error && typeof error === 'object' && 'errors' in error) {
      const graphqlErrors = (error as any).errors;
      if (Array.isArray(graphqlErrors) && graphqlErrors.length > 0 && graphqlErrors[0].message) {
        return new Error(graphqlErrors[0].message);
      }
    }

    if (error instanceof Error) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }
}
