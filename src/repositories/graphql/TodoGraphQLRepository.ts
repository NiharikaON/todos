import { ITodoRepository } from "@/repositories/interfaces";
import { Task } from "@/types";
import { generateClient } from "aws-amplify/api";
import { authRepository } from "@/repositories";
import { TodoOperations } from "@/graphql/operations";
import { AmplifyDataAdapter } from "@/adapters/AmplifyDataAdapter";


function cleanIsoDate(d?: string | null): string | null {
  if (!d || typeof d !== "string" || !d.trim() || d.trim().startsWith("T")) {
    return null;
  }
  return d;
}

export class TodoGraphQLRepository implements ITodoRepository {
  private async getOwnerId(): Promise<string | null> {
    try {
      const user = await authRepository.getCurrentUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }

  async getTasks(): Promise<Task[]> {
    try {
      const ownerId = await this.getOwnerId();
      if (!ownerId) {
        return [];
      }
      const response = await generateClient().graphql({
        query: TodoOperations.LIST_TODOS,
        variables: { userId: ownerId },
      });
      
      const items = (response as any).data?.listTodos || [];
      return items.map(AmplifyDataAdapter.mapAppSyncTodoToTask);
    } catch (error) {
      console.warn("Could not fetch tasks for user:", error);
      return [];
    }
  }

  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await generateClient().graphql({
        query: TodoOperations.GET_TODO,
        variables: { id },
      });
      
      const item = (response as any).data?.getTodo;
      if (!item) throw new Error("Task not found");
      return AmplifyDataAdapter.mapAppSyncTodoToTask(item);
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to fetch task");
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const ownerId = await this.getOwnerId();
      const newId = crypto.randomUUID();
      const response = await generateClient().graphql({
        query: TodoOperations.CREATE_TODO,
        variables: {
          id: newId,
          title: task.title,
          description: task.description || null,
          status: task.status,
          priority: task.priority || 'MEDIUM',
          dueDate: cleanIsoDate(task.dueDate),
          startDate: cleanIsoDate((task as any).startDate),
          endDate: cleanIsoDate((task as any).endDate),
          projectId: (task as any).projectId || null,
          assigneeId: (task as any).assigneeId || null,
          labels: (task as any).labels || null,
          comments: (task as any).comments || null,
          userId: ownerId,
          attachments: task.attachments || null,
          recurrenceRule: task.recurrenceRule || null,
          recurrenceExceptions: task.recurrenceExceptions || null,
          originalTodoId: task.originalTodoId || null,
          reminderSetting: (task as any).reminderSetting || null,
        },
      });
      
      return AmplifyDataAdapter.mapAppSyncTodoToTask((response as any).data?.createTodo);
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to create task");
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const ownerId = await this.getOwnerId();
      const variableDefs: string[] = ['$id: ID!', '$userId: String!'];
      const argsDefs: string[] = ['id: $id', 'userId: $userId'];
      const variables: any = { id, userId: ownerId };

      if (updates.title !== undefined) { variableDefs.push('$title: String'); argsDefs.push('title: $title'); variables.title = updates.title; }
      if (updates.description !== undefined) { variableDefs.push('$description: String'); argsDefs.push('description: $description'); variables.description = updates.description; }
      if (updates.status !== undefined) { variableDefs.push('$status: String'); argsDefs.push('status: $status'); variables.status = updates.status; }
      if (updates.priority !== undefined) { variableDefs.push('$priority: String'); argsDefs.push('priority: $priority'); variables.priority = updates.priority; }
      if (updates.dueDate !== undefined) { variableDefs.push('$dueDate: AWSDateTime'); argsDefs.push('dueDate: $dueDate'); variables.dueDate = cleanIsoDate(updates.dueDate); }
      if ((updates as any).startDate !== undefined) { variableDefs.push('$startDate: AWSDateTime'); argsDefs.push('startDate: $startDate'); variables.startDate = cleanIsoDate((updates as any).startDate); }
      if ((updates as any).endDate !== undefined) { variableDefs.push('$endDate: AWSDateTime'); argsDefs.push('endDate: $endDate'); variables.endDate = cleanIsoDate((updates as any).endDate); }
      if ((updates as any).assigneeId !== undefined) { variableDefs.push('$assigneeId: String'); argsDefs.push('assigneeId: $assigneeId'); variables.assigneeId = (updates as any).assigneeId; }
      if ((updates as any).labels !== undefined) { variableDefs.push('$labels: [String!]'); argsDefs.push('labels: $labels'); variables.labels = (updates as any).labels; }
      if ((updates as any).comments !== undefined) { variableDefs.push('$comments: [String!]'); argsDefs.push('comments: $comments'); variables.comments = (updates as any).comments; }
      if (updates.attachments !== undefined) { variableDefs.push('$attachments: [AttachmentInput!]'); argsDefs.push('attachments: $attachments'); variables.attachments = updates.attachments; }
      if (updates.recurrenceRule !== undefined) { variableDefs.push('$recurrenceRule: String'); argsDefs.push('recurrenceRule: $recurrenceRule'); variables.recurrenceRule = updates.recurrenceRule; }
      if (updates.recurrenceExceptions !== undefined) { variableDefs.push('$recurrenceExceptions: [String!]'); argsDefs.push('recurrenceExceptions: $recurrenceExceptions'); variables.recurrenceExceptions = updates.recurrenceExceptions; }
      if (updates.originalTodoId !== undefined) { variableDefs.push('$originalTodoId: ID'); argsDefs.push('originalTodoId: $originalTodoId'); variables.originalTodoId = updates.originalTodoId; }
      if ((updates as any).reminderSetting !== undefined) { variableDefs.push('$reminderSetting: String'); argsDefs.push('reminderSetting: $reminderSetting'); variables.reminderSetting = (updates as any).reminderSetting; }

      const query = `
        mutation UpdateTodo(${variableDefs.join(', ')}) {
          updateTodo(${argsDefs.join(', ')}) {
            id
            title
            description
            status
            priority
            dueDate
            startDate
            endDate
            assigneeId
            labels
            comments
            createdAt
            updatedAt
            projectId
            userId
            attachments {
              key
              name
              type
              size
            }
            recurrenceRule
            recurrenceExceptions
            originalTodoId
            reminderSetting
          }
        }
      `;

      const response = await generateClient().graphql({
        query,
        variables,
      });

      return AmplifyDataAdapter.mapAppSyncTodoToTask((response as any).data?.updateTodo);
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to update task");
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const ownerId = await this.getOwnerId();
      await generateClient().graphql({
        query: TodoOperations.DELETE_TODO,
        variables: { id, userId: ownerId },
      });
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to delete task");
    }
  }
}

export const todoGraphQLRepository = new TodoGraphQLRepository();
