"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Attachment } from "@/types";
import { ChevronLeft, ChevronRight, X, ExternalLink, Download } from "lucide-react";
import { storageRepository } from "@/repositories";

interface FilePreviewGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: Attachment[];
  initialAttachment?: Attachment;
}

export function FilePreviewGallery({ isOpen, onClose, attachments, initialAttachment }: FilePreviewGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAttachment && attachments.length > 0) {
      const idx = attachments.findIndex(a => a.key === initialAttachment.key);
      setCurrentIndex(idx >= 0 ? idx : 0);
    }
  }, [initialAttachment, attachments, isOpen]);

  const currentAttachment = attachments[currentIndex];

  useEffect(() => {
    if (!isOpen || !currentAttachment) return;
    
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setUrl(null);

    storageRepository.getFileUrl(currentAttachment.key)
      .then((signedUrl: string) => {
        if (isMounted) {
          setUrl(signedUrl);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error("Preview fetch error", err);
          setError("Failed to load preview.");
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [currentIndex, isOpen, currentAttachment]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % attachments.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + attachments.length) % attachments.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, attachments.length]);

  if (!isOpen || !currentAttachment) return null;

  const type = currentAttachment.type;
  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");
  const isAudio = type.startsWith("audio/");
  const isPdf = type === "application/pdf";
  const canPreview = isImage || isVideo || isAudio || isPdf;

  const handleDownload = () => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = currentAttachment.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 flex flex-col bg-black border-gray-800 gap-0 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 bg-black/50 z-10 text-white absolute top-0 w-full">
          <div className="flex items-center gap-2 max-w-[70%] truncate">
            <span className="font-medium truncate">{currentAttachment.name}</span>
            <span className="text-gray-400 text-sm">
              ({currentIndex + 1} of {attachments.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Navigation buttons */}
        {attachments.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white z-10 transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white z-10 transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* Content Area */}
        <div className="flex-1 w-full h-full flex items-center justify-center bg-black/90 p-12">
          {isLoading && <div className="animate-pulse w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />}
          
          {!isLoading && error && (
            <div className="text-red-400 text-center flex flex-col items-center">
              <p>{error}</p>
              <button onClick={handleDownload} className="mt-4 px-4 py-2 bg-white/10 rounded flex items-center gap-2 hover:bg-white/20">
                <Download className="w-4 h-4" /> Download Instead
              </button>
            </div>
          )}

          {!isLoading && url && !error && (
            <div className="w-full h-full flex items-center justify-center relative">
              {isImage && (
                <img
                  src={url}
                  alt={currentAttachment.name}
                  className="max-w-full max-h-full object-contain select-none"
                />
              )}
              {isVideo && (
                <video
                  src={url}
                  controls
                  className="max-w-full max-h-full"
                  autoPlay
                />
              )}
              {isAudio && (
                <audio
                  src={url}
                  controls
                  className="w-full max-w-md"
                  autoPlay
                />
              )}
              {isPdf && (
                <iframe
                  src={`${url}#toolbar=0`}
                  className="w-full h-full border-0 bg-white"
                  title={currentAttachment.name}
                />
              )}
              {!canPreview && (
                <div className="text-white text-center flex flex-col items-center max-w-sm">
                  <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <ExternalLink className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 truncate w-full">{currentAttachment.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">No preview available for {type}</p>
                  <button onClick={handleDownload} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded flex items-center gap-2 transition-colors">
                    <Download className="w-4 h-4" /> Download File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
