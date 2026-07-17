import { IProjectRepository } from "@/repositories/interfaces";
import { Project } from "@/types";
import { generateClient } from "aws-amplify/api";
import { authRepository } from "@/repositories";
import { ProjectOperations } from "@/graphql/operations";
import { AmplifyDataAdapter } from "@/adapters/AmplifyDataAdapter";


export class ProjectGraphQLRepository implements IProjectRepository {
  private async getOwnerId(): Promise<string> {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return user.id;
  }

  async getProjects(): Promise<Project[]> {
    try {
      const ownerId = await this.getOwnerId();
      const response = await generateClient().graphql({
        query: ProjectOperations.LIST_PROJECTS,
        variables: { ownerId: ownerId },
      });
      
      const items = (response as any).data?.listProjects || [];
      return items.map(AmplifyDataAdapter.mapAppSyncProjectToProject);
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to fetch projects");
    }
  }

  async getProjectById(id: string): Promise<Project> {
    try {
      const response = await generateClient().graphql({
        query: ProjectOperations.GET_PROJECT,
        variables: { id },
      });
      
      const item = (response as any).data?.getProject;
      if (!item) throw new Error("Project not found");
      return AmplifyDataAdapter.mapAppSyncProjectToProject(item);
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to fetch project");
    }
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      const ownerId = await this.getOwnerId();
      const newId = crypto.randomUUID();
      const response = await generateClient().graphql({
        query: ProjectOperations.CREATE_PROJECT,
        variables: {
          id: newId,
          name: project.name,
          description: project.description,
          ownerId: ownerId,
          attachments: project.attachments,
        },
      });
      
      return AmplifyDataAdapter.mapAppSyncProjectToProject((response as any).data?.createProject);
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to create project");
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const ownerId = await this.getOwnerId();
      const variableDefs: string[] = ['$id: ID!', '$ownerId: String!'];
      const argsDefs: string[] = ['id: $id', 'ownerId: $ownerId'];
      const variables: any = { id, ownerId: ownerId };

      if (updates.name !== undefined) { variableDefs.push('$name: String'); argsDefs.push('name: $name'); variables.name = updates.name; }
      if (updates.description !== undefined) { variableDefs.push('$description: String'); argsDefs.push('description: $description'); variables.description = updates.description; }
      if (updates.attachments !== undefined) { variableDefs.push('$attachments: [AttachmentInput!]'); argsDefs.push('attachments: $attachments'); variables.attachments = updates.attachments; }

      const query = `
        mutation UpdateProject(${variableDefs.join(', ')}) {
          updateProject(${argsDefs.join(', ')}) {
            id
            name
            description
            ownerId
            createdAt
            updatedAt
            attachments {
              key
              name
              type
              size
            }
          }
        }
      `;

      const response = await generateClient().graphql({
        query,
        variables,
      });

      return AmplifyDataAdapter.mapAppSyncProjectToProject((response as any).data?.updateProject);
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to update project");
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const ownerId = await this.getOwnerId();
      await generateClient().graphql({
        query: ProjectOperations.DELETE_PROJECT,
        variables: { id, ownerId: ownerId },
      });
    } catch (error) {
      throw AmplifyDataAdapter.mapError(error, "Failed to delete project");
    }
  }
}

export const projectGraphQLRepository = new ProjectGraphQLRepository();
