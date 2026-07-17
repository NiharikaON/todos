"use client";

import { useState } from "react";
import { Attachment } from "@/types";
import { FileCard } from "./FileCard";
import { FilePreviewGallery } from "./FilePreviewGallery";

interface FileListProps {
  files: Attachment[];
  onDelete?: (fileKey: string) => void;
  onDownload?: (fileKey: string) => void;
  disabled?: boolean;
}

export function FileList({ files, onDelete, onDownload, disabled }: FileListProps) {
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  if (files.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2">
          {files.map((file) => (
            <FileCard
              key={file.key}
              attachment={file}
              onPreview={(att) => setPreviewAttachment(att)}
              onDownload={onDownload ? (att) => onDownload(att.key) : undefined}
              onDelete={!disabled && onDelete ? (att) => onDelete(att.key) : undefined}
            />
          ))}
        </div>
      </div>

      <FilePreviewGallery
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachments={files}
        initialAttachment={previewAttachment || undefined}
      />
    </>
  );
}
