"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { todoRepository, projectRepository, storageRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import { 
  CheckCircle2, 
  Clock, 
  Activity,
  ArrowRight,
  Plus,
  Download,
  ArrowUpRight,
  FolderKanban,
  Layers,
  AlertCircle,
  Upload,
  UserPlus,
  FileText,
  X,
  Eye,
  Paperclip,
  Image,
  Music,
  Video,
  UploadCloud,
  Loader2,
  FileSpreadsheet,
  Archive,
  Folder,
  Edit2,
  Trash2
} from "lucide-react";
import { DashboardChart } from "@/components/DashboardChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDialog } from "@/components/ProjectDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Project } from "@/types";
import { useActivity } from "@/providers/ActivityProvider";
import toast from "react-hot-toast";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activities, logActivity } = useActivity();

  // Modal States
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isAddFilesDialogOpen, setIsAddFilesDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Add Files State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpeg,.jpg,.png,.webp,.mp3,.wav,.mp4,.mov,.avi,.mkv,.zip,.rar,.7z,.tar,.gz,.bz2,image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/x-tar,application/gzip";

  // Form States for Member Invite
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Developer");

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectRepository.getProjects(),
  });

  // Project Actions (Edit & Delete)
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectRepository.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
      setSelectedProject(null);
    },
    onError: () => {
      toast.error("Failed to delete project");
    }
  });

  const handleDeleteProject = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete project "${name}"?`)) {
      deleteProjectMutation.mutate(id);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(null);
    setProjectToEdit(project);
    setIsProjectDialogOpen(true);
  };

  // Handle Add Files selection
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Traverse dropped directory tree recursively
  const traverseFileTree = (entry: any, fileList: File[]): Promise<void> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((file: File) => {
          fileList.push(file);
          resolve();
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        dirReader.readEntries(async (entries: any[]) => {
          for (const childEntry of entries) {
            await traverseFileTree(childEntry, fileList);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  // Handle Drag & Drop of Files and Folders
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const items = e.dataTransfer.items;
    const extractedFiles: File[] = [];

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
          if (entry) {
            await traverseFileTree(entry, extractedFiles);
          } else {
            const file = item.getAsFile();
            if (file) extractedFiles.push(file);
          }
        }
      }
    } else if (e.dataTransfer.files) {
      extractedFiles.push(...Array.from(e.dataTransfer.files));
    }

    if (extractedFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...extractedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Add Files Submit
  const handleUploadFilesSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file or folder to upload.");
      return;
    }

    try {
      setIsUploadingFiles(true);
      let count = 0;

      for (const file of selectedFiles) {
        const result = await storageRepository.uploadFile(file, "Global", user?.id || "anonymous");
        const formattedSize = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;
        
        let category = "Document";
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(fileExt || "") || file.type.includes("zip") || file.type.includes("compressed") || file.type.includes("tar")) {
          category = "Zip / Archive";
        } else if (file.type.startsWith("image/")) {
          category = "Image";
        } else if (file.type.startsWith("audio/")) {
          category = "Audio";
        } else if (file.type.startsWith("video/")) {
          category = "Video";
        }

        logActivity({
          id: result.key || file.name,
          title: file.name,
          type: "file",
          subtitle: `${formattedSize} • ${category}`,
          href: "#"
        });
        count++;
      }

      toast.success(`Successfully added ${count} file${count === 1 ? '' : 's'} to workspace!`);
      setSelectedFiles([]);
      setIsAddFilesDialogOpen(false);
    } catch (err) {
      console.error("Error uploading files:", err);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Handle Add Member Submit
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    toast.success(`Invitation sent to ${memberEmail} (${memberRole})!`);
    setMemberName("");
    setMemberEmail("");
    setIsAddMemberDialogOpen(false);
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-purple-600 dark:text-purple-400 font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === "COMPLETED").length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === "IN_PROGRESS").length || 0;
  const pendingTasks = tasks?.filter(t => t.status !== "COMPLETED" && t.status !== "IN_PROGRESS").length || 0;

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-4 pb-2 min-h-0">
      {/* Header row */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-purple-900 dark:text-white tracking-tight leading-none">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-[13px] mt-1">
            Plan, prioritize, and accomplish your tasks with ease.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsProjectDialogOpen(true)}
            className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 active:scale-95 text-white px-4 py-2 rounded-full text-[13px] font-semibold transition-all shadow-sm shadow-purple-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
          <button 
            onClick={() => setIsAddFilesDialogOpen(true)}
            className="flex items-center space-x-2 bg-white dark:bg-slate-800 border-2 border-purple-100 dark:border-slate-700 hover:border-purple-200 active:scale-95 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-[13px] font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
            <span>Add Files</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-[84px]">
        {/* Total */}
        <Link href="/todos?status=ALL" className="block h-full">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800 dark:text-white leading-none">{totalTasks}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">Total Tasks</div>
            </div>
          </div>
        </Link>
        
        {/* Completed */}
        <Link href="/todos?status=COMPLETED" className="block h-full">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400 leading-none">{completedTasks}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">Completed</div>
            </div>
          </div>
        </Link>

        {/* In Progress */}
        <Link href="/todos?status=IN_PROGRESS" className="block h-full">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-none">{inProgressTasks}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">In Progress</div>
            </div>
          </div>
        </Link>

        {/* Pending */}
        <Link href="/todos?status=PENDING" className="block h-full">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 leading-none">{pendingTasks}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">Pending</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 h-full">
          {/* Recent Activity Section */}
          <Card className="bg-white dark:bg-slate-900 border-none rounded-3xl shadow-sm overflow-hidden shrink-0">
            <CardHeader className="px-5 py-3">
              <CardTitle className="text-[15px] font-bold text-slate-800 dark:text-white leading-none">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {activities.filter(a => !a.userId || a.userId === (user?.id || user?.email || "guest")).length > 0 ? (
                  activities
                    .filter(a => !a.userId || a.userId === (user?.id || user?.email || "guest"))
                    .slice(0, 5)
                    .map((act, index) => (
                      <Link 
                        href={act.href || "/todos"} 
                        key={`${act.id}-${index}`} 
                        className="group block p-3 px-5 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                              act.type === 'project' 
                                ? 'bg-purple-100 text-purple-600' 
                                : act.type === 'file' 
                                ? 'bg-emerald-100 text-emerald-600' 
                                : act.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {act.type === 'project' ? (
                                <FolderKanban className="w-4 h-4" />
                              ) : act.type === 'file' ? (
                                <FileText className="w-4 h-4" />
                              ) : act.status === 'COMPLETED' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors leading-tight truncate">
                                {act.title}
                              </p>
                              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                                {act.subtitle ? `${act.subtitle} • ` : ''}
                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              act.type === 'project' 
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                                : act.type === 'file' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                                : act.status === 'COMPLETED' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {act.type}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                ) : (
                  <div className="p-8 text-center text-xs font-medium text-gray-400">
                    No activity yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Upcoming Projects */}
        <div className="min-h-0 h-full">
          <Card className="bg-white dark:bg-slate-900 border-none rounded-3xl shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="p-4 border-b border-gray-50 dark:border-slate-800 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-[15px] font-bold text-slate-800 dark:text-white leading-none">Upcoming Projects</CardTitle>
                  <div className="text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded inline-block mt-1">
                    Recently Active
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
              <div className="space-y-3">
                {(!projects || projects.length === 0) ? (
                   <div className="text-center py-10">
                     <p className="text-gray-400 font-medium text-xs">No upcoming projects.</p>
                   </div>
                ) : (
                  projects.slice(0, 4).map(project => (
                    <div key={project.id} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl flex items-center justify-between group hover:bg-purple-600 transition-colors">
                       <div className="flex-1 min-w-0 pr-2">
                         <h4 className="font-bold text-slate-800 dark:text-white text-[13px] leading-tight group-hover:text-white transition-colors truncate">{project.name}</h4>
                         <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 group-hover:text-purple-100 transition-colors truncate">
                           {project.description || 'No description'}
                         </p>
                       </div>
                       <div className="flex items-center gap-1 shrink-0">
                         <button 
                           onClick={() => {
                             logActivity({
                               id: project.id,
                               title: project.name,
                               type: "project",
                               subtitle: project.description || "Project Overview",
                               href: "#"
                             });
                             setSelectedProject(project);
                           }}
                           className="bg-purple-600 text-white hover:bg-purple-700 group-hover:bg-white group-hover:text-purple-600 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                         >
                           View
                         </button>
                         <button 
                           onClick={() => handleEditProject(project)}
                           title="Edit Project"
                           className="p-1.5 text-gray-500 dark:text-gray-400 group-hover:text-white hover:bg-purple-700 dark:hover:bg-purple-900/50 rounded-lg transition-colors cursor-pointer"
                         >
                           <Edit2 className="w-3.5 h-3.5" />
                         </button>
                         <button 
                           onClick={() => handleDeleteProject(project.id, project.name)}
                           title="Delete Project"
                           className="p-1.5 text-gray-500 dark:text-gray-400 group-hover:text-red-200 hover:bg-red-600 dark:hover:bg-red-900/50 rounded-lg transition-colors cursor-pointer"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 1. Add / Edit Project Dialog */}
      <ProjectDialog 
        open={isProjectDialogOpen} 
        onOpenChange={(open) => {
          setIsProjectDialogOpen(open);
          if (!open) setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />

      {/* 2. Add Files & Folders Dialog */}
      <Dialog open={isAddFilesDialogOpen} onOpenChange={setIsAddFilesDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-purple-600" />
              Add Files & Folders to Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Upload documents, zip archives, images, audio, video, or select an entire folder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* File Drop & Selection Area */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-purple-200 dark:border-purple-900/50 rounded-2xl p-6 text-center bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors relative group"
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    Drag & Drop Files, Zip Archives, or Folders here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Or choose one of the browse options below:
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 z-20">
                  <label className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Browse Files & Zips</span>
                    <input
                      type="file"
                      multiple
                      accept={ACCEPTED_FILE_TYPES}
                      onChange={handleSelectFiles}
                      className="hidden"
                    />
                  </label>

                  <label className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 hover:border-purple-300 active:scale-95 text-purple-700 dark:text-purple-300 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>Browse Entire Folder</span>
                    <input
                      type="file"
                      multiple
                      {...({ webkitdirectory: "", directory: "", mozdirectory: "" } as any)}
                      onChange={handleSelectFiles}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Allowed file category badges */}
            <div className="flex flex-wrap gap-1.5 justify-center py-1">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-500" /> Documents (PDF, DOC, XLS, TXT, CSV)
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Archive className="w-3 h-3 text-amber-500" /> Zip & Archives (ZIP, RAR, 7Z, TAR, GZ)
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Image className="w-3 h-3 text-emerald-500" /> Images (JPEG, JPG, PNG, WEBP)
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Music className="w-3 h-3 text-purple-500" /> Audio (MP3, WAV)
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Video className="w-3 h-3 text-pink-500" /> Videos (MP4, MOV, AVI)
              </span>
            </div>

            {/* Selected files list preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Selected Items ({selectedFiles.length}):</span>
                  <button 
                    onClick={() => setSelectedFiles([])}
                    className="text-[10px] text-red-500 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </p>
                {selectedFiles.map((file, idx) => {
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  const isArchive = ["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext || "") || file.type.includes("zip") || file.type.includes("compressed");
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {isArchive ? (
                          <Archive className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : file.type.startsWith("image/") ? (
                          <Image className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : file.type.startsWith("audio/") ? (
                          <Music className="w-4 h-4 text-purple-500 shrink-0" />
                        ) : file.type.startsWith("video/") ? (
                          <Video className="w-4 h-4 text-pink-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 dark:text-white truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              onClick={() => setIsAddFilesDialogOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadFilesSubmit}
              disabled={isUploadingFiles || selectedFiles.length === 0}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isUploadingFiles ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading Files...</span>
                </>
              ) : (
                <>
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Upload & Save Files</span>
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              Add Team Member
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Invite a new member to collaborate on your workspace projects and tasks.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMemberSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Member Name
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role
              </label>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Developer">Developer</option>
                <option value="Designer">Designer</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <button
                type="button"
                onClick={() => setIsAddMemberDialogOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-colors"
              >
                Send Invite
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. View Project Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {selectedProject?.name}
                </DialogTitle>
                <span className="inline-block mt-1 text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                  Project Details
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div>
              <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Description</h5>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedProject?.description || "No detailed description provided for this project."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 block">Created On</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedProject ? new Date(selectedProject.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 block">Owner ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {selectedProject?.ownerId || 'Workspace Admin'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => selectedProject && handleDeleteProject(selectedProject.id, selectedProject.name)}
                className="px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => selectedProject && handleEditProject(selectedProject)}
                className="px-3 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-colors cursor-pointer w-full sm:w-auto"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
