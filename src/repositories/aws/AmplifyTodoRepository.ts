import { ITodoRepository } from "../interfaces";
import { Task, Status, Priority } from "@/types";
import { generateClient } from "aws-amplify/api";
import { amplifyAuthRepository } from "./AmplifyAuthRepository";

// GraphQL Queries & Mutations
const listTodosQuery = `
  query ListTodos($owner: String!) {
    listTodos(owner: $owner) {
      id
      content
      isCompleted
      owner
    }
  }
`;

const createTodoMutation = `
  mutation CreateTodo($id: ID!, $content: String!, $isCompleted: Boolean!, $owner: String!) {
    createTodo(id: $id, content: $content, isCompleted: $isCompleted, owner: $owner) {
      id
      content
      isCompleted
      owner
    }
  }
`;

const updateTodoMutation = `
  mutation UpdateTodo($id: ID!, $content: String, $isCompleted: Boolean, $owner: String!) {
    updateTodo(id: $id, content: $content, isCompleted: $isCompleted, owner: $owner) {
      id
      content
      isCompleted
      owner
    }
  }
`;

const deleteTodoMutation = `
  mutation DeleteTodo($id: ID!, $owner: String!) {
    deleteTodo(id: $id, owner: $owner) {
      id
    }
  }
`;

// Helper to map AppSync Todo to UI Task
function mapAppSyncTodoToTask(appSyncTodo: any): Task {
  return {
    id: appSyncTodo.id,
    userId: appSyncTodo.owner,
    title: appSyncTodo.content,
    description: "", // Manual schema doesn't have description
    status: appSyncTodo.isCompleted ? "COMPLETED" : "PENDING",
    priority: "MEDIUM", // Manual schema doesn't have priority
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}



export class AmplifyTodoRepository implements ITodoRepository {
  private async getOwnerId(): Promise<string> {
    const user = await amplifyAuthRepository.getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return user.id;
  }

  async getTasks(): Promise<Task[]> {
    try {
      const ownerId = await this.getOwnerId();
      const response = await generateClient().graphql({
        query: listTodosQuery,
        variables: { owner: ownerId },
      });
      
      const items = (response as any).data?.listTodos || [];
      return items.map(mapAppSyncTodoToTask);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  }

  async getTaskById(id: string): Promise<Task> {
    const tasks = await this.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    return task;
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const ownerId = await this.getOwnerId();
    const newId = crypto.randomUUID();
    const response = await generateClient().graphql({
      query: createTodoMutation,
      variables: {
        id: newId,
        content: task.title,
        isCompleted: task.status === "COMPLETED",
        owner: ownerId,
      },
    });
    
    return mapAppSyncTodoToTask((response as any).data?.createTodo);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const ownerId = await this.getOwnerId();
    const variables: any = { id, owner: ownerId };
    if (updates.title !== undefined) variables.content = updates.title;
    if (updates.status !== undefined) variables.isCompleted = updates.status === "COMPLETED";

    const response = await generateClient().graphql({
      query: updateTodoMutation,
      variables,
    });

    return mapAppSyncTodoToTask((response as any).data?.updateTodo);
  }

  async deleteTask(id: string): Promise<void> {
    const ownerId = await this.getOwnerId();
    await generateClient().graphql({
      query: deleteTodoMutation,
      variables: { id, owner: ownerId },
    });
  }
}

export const amplifyTodoRepository = new AmplifyTodoRepository();
