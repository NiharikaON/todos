import React from "react";
import { Download, Trash2, Eye, FileText, Image as ImageIcon, Film, Music, FileArchive, File as FileIcon } from "lucide-react";
import { Attachment } from "@/types";
import { formatFileSize } from "@/types/storage";

interface FileCardProps {
  attachment: Attachment;
  onPreview?: (attachment: Attachment) => void;
  onDownload?: (attachment: Attachment) => void;
  onDelete?: (attachment: Attachment) => void;
}

export function getFileIcon(type: string, name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  const isArchive = type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("7z") || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '');

  if (type.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
  if (type.startsWith("video/")) return <Film className="w-8 h-8 text-purple-500" />;
  if (type.startsWith("audio/")) return <Music className="w-8 h-8 text-pink-500" />;
  if (type === "application/pdf" || ext === "pdf") return <FileText className="w-8 h-8 text-red-500" />;
  if (isArchive) return <FileArchive className="w-8 h-8 text-yellow-500" />;
  if (type.includes("word") || type.includes("document") || ['doc', 'docx'].includes(ext || '')) return <FileText className="w-8 h-8 text-blue-700" />;
  if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv") || ['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileText className="w-8 h-8 text-green-600" />;
  return <FileIcon className="w-8 h-8 text-gray-500" />;
}

export function FileCard({ attachment, onPreview, onDownload, onDelete }: FileCardProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {getFileIcon(attachment.type, attachment.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-xs" title={attachment.name}>
            {attachment.name}
          </p>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatFileSize(attachment.size)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {onPreview && (
          <button
            onClick={() => onPreview(attachment)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
            title="Preview"
            type="button"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {onDownload && (
          <button
            onClick={() => onDownload(attachment)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            title="Download"
            type="button"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(attachment)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Delete"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
