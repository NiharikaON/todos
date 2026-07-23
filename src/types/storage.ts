// ─── Storage Types ───────────────────────────────────────────────────────────

export interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  key: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  // Video
  "video/mp4",
  "video/quicktime",
  "video/webm",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ACCEPTED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".txt", ".csv",
  ".mp3", ".wav", ".ogg",
  ".mp4", ".mov", ".webm",
  ".zip", ".rar", ".7z"
] as const;

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateFile(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
  const isTypeAccepted = ACCEPTED_FILE_TYPES.some((type) => file.type === type);
  const isExtAccepted = ACCEPTED_EXTENSIONS.includes(fileExt as any);

  if (!isTypeAccepted && !isExtAccepted) {
    return {
      valid: false,
      error: `File type "${file.name}" is not supported. Accepted: Images, Documents, PDFs, Audio, Video, Zip/Archives.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(type: string): string {
  if (type.startsWith("image/")) return "image";
  if (type === "application/pdf") return "pdf";
  if (type.includes("word") || type.includes("document")) return "doc";
  if (type.includes("sheet") || type.includes("excel")) return "spreadsheet";
  if (type.startsWith("text/")) return "text";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "archive";
  return "file";
}
