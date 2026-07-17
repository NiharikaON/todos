import { ITodoRepository } from "../interfaces";
import { Task } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Initial mock data
let mockTasks: Task[] = [
  {
    id: "1",
    userId: "mock-user-123",
    title: "Setup Enterprise Architecture",
    description: "Implement repository pattern and strict types",
    status: "COMPLETED",
    priority: "HIGH",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    userId: "mock-user-123",
    title: "Configure shadcn/ui",
    description: "Initialize components and setup theme",
    status: "IN_PROGRESS",
    priority: "HIGH",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    userId: "mock-user-123",
    title: "Mock Repositories",
    description: "Build mock data layer for local development",
    status: "PENDING",
    priority: "MEDIUM",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export class MockTodoRepository implements ITodoRepository {
  private async delay() {
    return new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network latency
  }

  async getTasks(): Promise<Task[]> {
    await this.delay();
    return [...mockTasks];
  }

  async getTaskById(id: string): Promise<Task> {
    await this.delay();
    const task = mockTasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    return { ...task };
  }

  async createTask(taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await this.delay();
    const newTask: Task = {
      ...taskInput,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTasks.unshift(newTask);
    return { ...newTask };
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await this.delay();
    const index = mockTasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Task not found");
    
    mockTasks[index] = {
      ...mockTasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { ...mockTasks[index] };
  }

  async deleteTask(id: string): Promise<void> {
    await this.delay();
    mockTasks = mockTasks.filter((t) => t.id !== id);
  }
}

export const todoRepository = new MockTodoRepository();
