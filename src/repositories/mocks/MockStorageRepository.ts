import { IStorageRepository } from "../interfaces";
import { StorageFile } from "@/types/storage";
import { v4 as uuidv4 } from "uuid";

/**
 * MockStorageRepository stores files in browser memory using base64 data URLs.
 * Fully functional on localhost without any cloud dependency.
 */

// In-memory file store
const fileStore = new Map<string, { file: StorageFile; dataUrl: string }>();

export class MockStorageRepository implements IStorageRepository {
  private async delay(ms: number = 300) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async uploadFile(
    file: File,
    entityType: string,
    entityId: string,
    onProgress?: (progress: number) => void
  ): Promise<StorageFile> {
    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onProgress(i);
      }
    }

    const fileId = uuidv4();
    const fileKey = `mock/${entityType}/${entityId}/${fileId}-${file.name}`;

    // Convert file to data URL for preview
    const dataUrl = await this.fileToDataUrl(file);

    const storageFile: StorageFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: dataUrl,
      key: fileKey,
      entityType,
      entityId,
      createdAt: new Date().toISOString(),
    };

    fileStore.set(fileKey, { file: storageFile, dataUrl });

    return storageFile;
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.delay();
    fileStore.delete(fileKey);
  }

  async getFileUrl(fileKey: string): Promise<string> {
    await this.delay(100);
    const entry = fileStore.get(fileKey);
    if (!entry) throw new Error("File not found");
    return entry.dataUrl;
  }

  async listFiles(entityType: string, entityId: string): Promise<StorageFile[]> {
    await this.delay(200);
    const files: StorageFile[] = [];
    fileStore.forEach(({ file }) => {
      if (file.entityType === entityType && file.entityId === entityId) {
        files.push(file);
      }
    });
    return files.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const mockStorageRepository = new MockStorageRepository();
