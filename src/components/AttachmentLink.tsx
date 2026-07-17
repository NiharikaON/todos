"use client";

import { useState } from "react";
import { getUrl } from "aws-amplify/storage";
import { Paperclip, Loader2 } from "lucide-react";
import { Attachment } from "@/types";

export function AttachmentLink({ attachment }: { attachment: Attachment }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const urlResult = await getUrl({ key: attachment.key });
      window.open(urlResult.url.toString(), "_blank");
    } catch (error) {
      console.error("Error getting file URL:", error);
      alert("Failed to open file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 border border-gray-200 dark:border-gray-700 shadow-sm"
      title={`Download ${attachment.name} (${Math.round(attachment.size / 1024)} KB)`}
    >
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
      <span className="truncate max-w-[150px]">{attachment.name}</span>
    </button>
  );
}
