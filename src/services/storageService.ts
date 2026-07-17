/**
 * @deprecated This service is deprecated. Use `IStorageRepository` via `RepositoryFactory` instead.
 * Example: `import { storageRepository } from "@/repositories";`
 */
import { uploadData, remove, getUrl } from 'aws-amplify/storage';
import { v4 as uuidv4 } from 'uuid';

export const storageService = {
  /**
   * Uploads a file to S3 and returns the generated unique file key
   */
  async uploadFile(file: File, userId: string): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop();
      const uniqueFileKey = `${userId}/${uuidv4()}.${fileExtension}`;
      
      await uploadData({
        key: uniqueFileKey,
        data: file,
        options: {
          accessLevel: 'private', // Only the logged-in user can access this path
        }
      }).result;
      
      return uniqueFileKey;
    } catch (error) {
      console.error("Error uploading file to S3", error);
      throw new Error("Failed to upload file");
    }
  },

  /**
   * Deletes a file from S3 by its key
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      await remove({ 
        key: fileKey,
        options: {
          accessLevel: 'private',
        }
      });
    } catch (error) {
      console.error("Error deleting file from S3", error);
      throw new Error("Failed to delete file");
    }
  },

  /**
   * Generates a temporary, secure signed URL to view or download the file
   */
  async getSignedUrl(fileKey: string): Promise<string> {
    try {
      const result = await getUrl({
        key: fileKey,
        options: {
          accessLevel: 'private',
          validateObjectExistence: true,
          expiresIn: 3600 // URL expires in 1 hour
        }
      });
      return result.url.toString();
    } catch (error) {
      console.error("Error getting signed URL", error);
      throw new Error("Failed to generate secure URL");
    }
  }
};
