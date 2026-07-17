import { IProjectRepository } from "../interfaces";
import { Project } from "@/types";
import { generateClient } from "aws-amplify/api";
import { amplifyAuthRepository } from "./AmplifyAuthRepository";

const client = generateClient();

// GraphQL Queries & Mutations
const listProjectsQuery = `
  query ListProjects($owner: String!) {
    listProjects(owner: $owner) {
      id
      name
      description
      owner
      createdAt
      updatedAt
    }
  }
`;

const createProjectMutation = `
  mutation CreateProject($id: ID!, $name: String!, $description: String, $owner: String!) {
    createProject(id: $id, name: $name, description: $description, owner: $owner) {
      id
      name
      description
      owner
      createdAt
      updatedAt
    }
  }
`;

const updateProjectMutation = `
  mutation UpdateProject($id: ID!, $name: String, $description: String, $owner: String!) {
    updateProject(id: $id, name: $name, description: $description, owner: $owner) {
      id
      name
      description
      owner
      createdAt
      updatedAt
    }
  }
`;

const deleteProjectMutation = `
  mutation DeleteProject($id: ID!, $owner: String!) {
    deleteProject(id: $id, owner: $owner) {
      id
    }
  }
`;

function mapAppSyncProjectToProject(appSyncProject: any): Project {
  return {
    id: appSyncProject.id,
    name: appSyncProject.name,
    description: appSyncProject.description || "",
    ownerId: appSyncProject.owner,
    createdAt: appSyncProject.createdAt || new Date().toISOString(),
    updatedAt: appSyncProject.updatedAt || new Date().toISOString(),
  };
}

export class AmplifyProjectRepository implements IProjectRepository {
  private async getOwnerId(): Promise<string> {
    const user = await amplifyAuthRepository.getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return user.id;
  }

  async getProjects(): Promise<Project[]> {
    try {
      const ownerId = await this.getOwnerId();
      const response = await client.graphql({
        query: listProjectsQuery,
        variables: { owner: ownerId },
      });
      
      const items = (response as any).data?.listProjects || [];
      return items.map(mapAppSyncProjectToProject);
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  }

  async getProjectById(id: string): Promise<Project> {
    const projects = await this.getProjects();
    const project = projects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    return project;
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const ownerId = await this.getOwnerId();
    const newId = crypto.randomUUID();
    const response = await client.graphql({
      query: createProjectMutation,
      variables: {
        id: newId,
        name: project.name,
        description: project.description,
        owner: ownerId,
      },
    });
    
    return mapAppSyncProjectToProject((response as any).data?.createProject);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const ownerId = await this.getOwnerId();
    const variables: any = { id, owner: ownerId };
    if (updates.name !== undefined) variables.name = updates.name;
    if (updates.description !== undefined) variables.description = updates.description;

    const response = await client.graphql({
      query: updateProjectMutation,
      variables,
    });

    return mapAppSyncProjectToProject((response as any).data?.updateProject);
  }

  async deleteProject(id: string): Promise<void> {
    const ownerId = await this.getOwnerId();
    await client.graphql({
      query: deleteProjectMutation,
      variables: { id, owner: ownerId },
    });
  }
}

export const amplifyProjectRepository = new AmplifyProjectRepository();
