"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { todoRepository, projectRepository, storageRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import { Attachment, Task } from "@/types";
import { FileCard } from "@/components/FileCard";
import { FilePreviewGallery } from "@/components/FilePreviewGallery";
import { Search, Filter, Folder, Calendar } from "lucide-react";
import toast from "react-hot-toast";

type FilterType = "ALL" | "IMAGES" | "DOCUMENTS" | "VIDEOS" | "AUDIO" | "ARCHIVES";

export default function FilesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => todoRepository.getTasks(),
    enabled: !!user?.id,
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: () => projectRepository.getProjects(),
    enabled: !!user?.id,
  });

  const isLoading = isLoadingTasks || isLoadingProjects;

  // Aggregate all files from tasks and projects
  const allFiles = useMemo(() => {
    const files: (Attachment & { taskTitle: string; entityType: "Task" | "Project" })[] = [];
    tasks.forEach(task => {
      if (task.attachments) {
        task.attachments.forEach(att => {
          files.push({ ...att, taskTitle: task.title, entityType: "Task" });
        });
      }
    });
    projects.forEach(project => {
      if (project.attachments) {
        project.attachments.forEach(att => {
          files.push({ ...att, taskTitle: project.name, entityType: "Project" });
        });
      }
    });
    // Sort by newest first (assuming newest are at the top, or we can sort by date if it was in attachment)
    return files;
  }, [tasks, projects]);

  const filteredFiles = useMemo(() => {
    return allFiles.filter(file => {
      // Search
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            file.taskTitle.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Filter
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isArchive = file.type.includes("zip") || file.type.includes("rar") || file.type.includes("tar") || file.type.includes("7z") || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '');

      if (activeFilter === "ALL") return true;
      if (activeFilter === "IMAGES") return file.type.startsWith("image/");
      if (activeFilter === "VIDEOS") return file.type.startsWith("video/");
      if (activeFilter === "AUDIO") return file.type.startsWith("audio/");
      if (activeFilter === "ARCHIVES") return isArchive;
      if (activeFilter === "DOCUMENTS") return !file.type.startsWith("image/") && !file.type.startsWith("video/") && !file.type.startsWith("audio/") && !isArchive;
      
      return true;
    });
  }, [allFiles, searchQuery, activeFilter]);

  const handleDownload = async (fileKey: string) => {
    try {
      const url = await storageRepository.getFileUrl(fileKey);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const tabs: { label: string; value: FilterType }[] = [
    { label: "All Files", value: "ALL" },
    { label: "Images", value: "IMAGES" },
    { label: "Documents", value: "DOCUMENTS" },
    { label: "Videos", value: "VIDEOS" },
    { label: "Audio", value: "AUDIO" },
    { label: "Archives", value: "ARCHIVES" },
  ];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Files & Attachments
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name or task..."
            className="pl-10 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.value
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Folder className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No files found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || activeFilter !== "ALL"
              ? "Try adjusting your search or filters"
              : "Upload files to your tasks and they will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map(file => (
            <div key={file.key} className="relative group">
              <FileCard
                attachment={file}
                onPreview={setPreviewAttachment}
                onDownload={(att) => handleDownload(att.key)}
              />
              <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-xs bg-black/50 text-white px-2 py-1 rounded truncate max-w-[120px]">
                   {file.entityType}: {file.taskTitle}
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <FilePreviewGallery
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachments={filteredFiles}
        initialAttachment={previewAttachment || undefined}
      />
    </div>
  );
}
