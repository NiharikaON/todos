import { StorageFile } from "@/types/storage";
import { getUrl } from "aws-amplify/storage";

export class AmplifyStorageAdapter {
  static mapError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      return new Error(error.message);
    }
    return new Error(defaultMessage);
  }

  static async getSignedUrl(key: string): Promise<string> {
    try {
      const urlResponse = await getUrl({ key });
      return urlResponse.url.toString();
    } catch (error) {
      console.error(`Error getting URL for ${key}:`, error);
      return "";
    }
  }

  static async mapAmplifyItemToStorageFile(item: any, entityType: string, entityId: string): Promise<StorageFile> {
    const url = await this.getSignedUrl(item.key);
    const fileName = item.key.split('/').pop() || item.key;
    // We try to infer type from extension if it's not stored in metadata
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    let type = "application/octet-stream";
    if (extension) {
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) type = `image/${extension}`;
      else if (extension === 'pdf') type = 'application/pdf';
      else if (['doc', 'docx'].includes(extension)) type = 'application/msword';
    }

    return {
      id: fileName, // Using filename as ID for simplicity
      name: fileName,
      size: item.size || 0,
      type,
      url,
      key: item.key,
      entityType,
      entityId,
      createdAt: item.lastModified ? item.lastModified.toISOString() : new Date().toISOString(),
    };
  }
}
