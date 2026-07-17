"use client";

import { useState, useCallback } from "react";
import { StorageFile, UploadProgress, validateFile } from "@/types/storage";
import { storageRepository } from "@/repositories";
import { IStorageRepository } from "@/repositories/interfaces";

interface UseFileUploadOptions {
  entityType: string;
  entityId: string;
  repository?: IStorageRepository;
  maxFiles?: number;
}

interface UseFileUploadReturn {
  files: StorageFile[];
  progress: UploadProgress[];
  isUploading: boolean;
  uploadFiles: (fileList: FileList | File[]) => Promise<void>;
  removeFile: (fileKey: string) => Promise<void>;
  setInitialFiles: (files: StorageFile[]) => void;
}

export function useFileUpload({
  entityType,
  entityId,
  repository = storageRepository,
  maxFiles = 10,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const setInitialFiles = useCallback((initialFiles: StorageFile[]) => {
    setFiles(initialFiles);
  }, []);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesToUpload = Array.from(fileList);

      if (files.length + filesToUpload.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }

      // Validate all files first
      for (const file of filesToUpload) {
        const validation = validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      setIsUploading(true);

      // Initialize progress for all files
      const initialProgress: UploadProgress[] = filesToUpload.map((file) => ({
        fileId: file.name + Date.now(),
        fileName: file.name,
        progress: 0,
        status: "pending" as const,
      }));
      setProgress(initialProgress);

      const uploadedFiles: StorageFile[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];

        // Update status to uploading
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: "uploading" as const } : p
          )
        );

        try {
          const storageFile = await repository.uploadFile(
            file,
            entityType,
            entityId,
            (pct) => {
              setProgress((prev) =>
                prev.map((p, idx) =>
                  idx === i ? { ...p, progress: pct } : p
                )
              );
            }
          );

          uploadedFiles.push(storageFile);

          // Mark as complete
          setProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, progress: 100, status: "complete" as const }
                : p
            )
          );
        } catch (error) {
          setProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    ...p,
                    status: "error" as const,
                    error: error instanceof Error ? error.message : "Upload failed",
                  }
                : p
            )
          );
        }
      }

      setFiles((prev) => [...prev, ...uploadedFiles]);
      setIsUploading(false);

      // Clear progress after a short delay
      setTimeout(() => setProgress([]), 2000);
    },
    [entityType, entityId, repository, files.length, maxFiles]
  );

  const removeFile = useCallback(
    async (fileKey: string) => {
      await repository.deleteFile(fileKey);
      setFiles((prev) => prev.filter((f) => f.key !== fileKey));
    },
    [repository]
  );

  return {
    files,
    progress,
    isUploading,
    uploadFiles,
    removeFile,
    setInitialFiles,
  };
}
