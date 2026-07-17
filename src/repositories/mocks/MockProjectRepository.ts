import { IProjectRepository } from "../interfaces";
import { Project } from "@/types";
import { v4 as uuidv4 } from "uuid";

let mockProjects: Project[] = [
  {
    id: "1",
    name: "Q3 Marketing Campaign",
    description: "Plan and execute the marketing campaign for Q3.",
    ownerId: "mock-user-1",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "2",
    name: "Website Redesign",
    description: "Overhaul the corporate website for better conversions.",
    ownerId: "mock-user-1",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  }
];

export class MockProjectRepository implements IProjectRepository {
  private async delay() {
    return new Promise((resolve) => setTimeout(resolve, 600));
  }

  async getProjects(): Promise<Project[]> {
    await this.delay();
    return [...mockProjects];
  }

  async getProjectById(id: string): Promise<Project> {
    await this.delay();
    const project = mockProjects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    return { ...project };
  }

  async createProject(projectInput: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    await this.delay();
    const newProject: Project = {
      ...projectInput,
      id: `proj-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProjects.unshift(newProject);
    return { ...newProject };
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await this.delay();
    const index = mockProjects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Project not found");
    
    mockProjects[index] = {
      ...mockProjects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { ...mockProjects[index] };
  }

  async deleteProject(id: string): Promise<void> {
    await this.delay();
    mockProjects = mockProjects.filter((p) => p.id !== id);
  }
}

export const projectRepository = new MockProjectRepository();
