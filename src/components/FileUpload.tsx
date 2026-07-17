"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, ImageIcon, FileSpreadsheet, File as FileIcon } from "lucide-react";
import { UploadProgress, formatFileSize, ACCEPTED_EXTENSIONS } from "@/types/storage";

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  progress: UploadProgress[];
  isUploading: boolean;
  disabled?: boolean;
}

export function FileUpload({ onFilesSelected, progress, isUploading, disabled }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [disabled, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input so the same file can be selected again
      if (inputRef.current) inputRef.current.value = "";
    },
    [onFilesSelected]
  );

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all duration-200
          ${isDragOver
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Upload className={`w-8 h-8 mb-2 ${isDragOver ? "text-indigo-500" : "text-gray-400"}`} />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDragOver ? "Drop files here" : "Drag & drop files, or click to browse"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Max 10MB per file · Images, PDFs, Documents
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {progress.length > 0 && (
        <div className="space-y-2">
          {progress.map((p) => (
            <div key={p.fileId} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex-shrink-0">
                {p.status === "error" ? (
                  <X className="w-4 h-4 text-red-500" />
                ) : (
                  <FileIcon className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {p.fileName}
                </p>
                {p.status === "error" ? (
                  <p className="text-xs text-red-500">{p.error}</p>
                ) : (
                  <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        p.status === "complete" ? "bg-green-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {p.status === "complete" ? "✓" : `${p.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
