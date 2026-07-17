// ─── Storage Configuration ───────────────────────────────────────────────────

import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from "@/types/storage";

export const storageConfig = {
  s3Bucket: process.env.NEXT_PUBLIC_S3_BUCKET || "",
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  maxFileSize: MAX_FILE_SIZE,
  acceptedTypes: ACCEPTED_FILE_TYPES,
} as const;
