import { IStorageRepository } from "@/repositories/interfaces";
import { StorageFile } from "@/types/storage";
import { uploadData, remove, list } from "aws-amplify/storage";
import { AmplifyStorageAdapter } from "@/adapters/AmplifyStorageAdapter";
import { authRepository } from "@/repositories";
import { v4 as uuidv4 } from "uuid";

export class AmplifyStorageRepository implements IStorageRepository {
  private async getUserId(): Promise<string> {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return user.id;
  }

  async uploadFile(
    file: File,
    entityType: string,
    entityId: string,
    onProgress?: (progress: number) => void
  ): Promise<StorageFile> {
    try {
      const userId = await this.getUserId();
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop() || '';
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      
      // key format: userId/entityType/entityId/uuid_filename.ext
      const key = `${userId}/${entityType}/${entityId}/${fileId}_${sanitizedName}`;

      const uploadTask = uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
          onProgress: (event) => {
            if (onProgress && event.totalBytes) {
              const progress = Math.round((event.transferredBytes / event.totalBytes) * 100);
              onProgress(progress);
            }
          },
        },
      });

      const result = await uploadTask.result;

      // We need to fetch the file to get the URL
      return AmplifyStorageAdapter.mapAmplifyItemToStorageFile(
        { key: result.key, size: file.size, lastModified: new Date() },
        entityType,
        entityId
      );
    } catch (error) {
      throw AmplifyStorageAdapter.mapError(error, "Failed to upload file");
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      await remove({ key: fileKey });
    } catch (error) {
      throw AmplifyStorageAdapter.mapError(error, "Failed to delete file");
    }
  }

  async getFileUrl(fileKey: string): Promise<string> {
    return AmplifyStorageAdapter.getSignedUrl(fileKey);
  }

  async listFiles(entityType: string, entityId: string): Promise<StorageFile[]> {
    try {
      const userId = await this.getUserId();
      const prefix = `${userId}/${entityType}/${entityId}/`;

      const response = await list({ prefix });
      
      const filePromises = response.items.map((item) => 
        AmplifyStorageAdapter.mapAmplifyItemToStorageFile(item, entityType, entityId)
      );

      return Promise.all(filePromises);
    } catch (error) {
      throw AmplifyStorageAdapter.mapError(error, "Failed to list files");
    }
  }
}

export const amplifyStorageRepository = new AmplifyStorageRepository();
