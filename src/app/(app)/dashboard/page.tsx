"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { todoRepository, projectRepository, storageRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import { 
  CheckCircle2, 
  Clock, 
  Activity,
  Plus,
  FolderKanban,
  Layers,
  AlertCircle,
  FileText,
  X,
  Paperclip,
  Image,
  Music,
  Video,
  UploadCloud,
  Loader2,
  Archive,
  Folder,
  Edit2,
  Trash2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  UserPlus,
  ArrowRight
} from "lucide-react";
import { DashboardChart } from "@/components/DashboardChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDialog } from "@/components/ProjectDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Project, Task } from "@/types";
import { useActivity } from "@/providers/ActivityProvider";
import toast from "react-hot-toast";
import Link from "next/link";
import { TodoDialog } from "@/components/TodoDialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activities, logActivity } = useActivity();

  // Modal & Dialog States
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isAddFilesDialogOpen, setIsAddFilesDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpeg,.jpg,.png,.webp,.mp3,.wav,.mp4,.mov,.avi,.mkv,.zip,.rar,.7z,.tar,.gz,.bz2,image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/x-tar,application/gzip";

  // Form States for Member Invite
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Developer");

  // React Query Data Fetching
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectRepository.getProjects(),
  });

  // Project Deletion
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

  // Handle Add Files Selection
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Handle File Upload Submit
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
        if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(fileExt || "")) category = "Zip / Archive";
        else if (file.type.startsWith("image/")) category = "Image";
        else if (file.type.startsWith("audio/")) category = "Audio";
        else if (file.type.startsWith("video/")) category = "Video";

        logActivity({
          id: result.key || file.name,
          title: file.name,
          type: "file",
          subtitle: `${formattedSize} • ${category}`,
          href: "#"
        });
        count++;
      }

      toast.success(`Uploaded ${count} file${count === 1 ? '' : 's'} successfully!`);
      setSelectedFiles([]);
      setIsAddFilesDialogOpen(false);
    } catch (err) {
      console.error("Error uploading files:", err);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Task Statistics Math
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED" && t.status !== "IN_PROGRESS").length;
  
  const nowTime = new Date().getTime();
  const overdueTasks = tasks.filter(t => {
    if (t.status === "COMPLETED") return false;
    const target = t.endDate || t.dueDate || t.startDate;
    return target ? new Date(target).getTime() < nowTime : false;
  }).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-6">
      
      {/* 1. Top Welcome Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/10">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 text-white">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              ⚡ Productivity Score: {completionRate > 50 ? "94%" : "82%"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Niharika"}! 👋
            </h1>
            <p className="text-sm text-indigo-100/90 max-w-xl font-medium">
              You have <span className="font-extrabold text-white">{pendingTasks + inProgressTasks} active tasks</span> waiting for you today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="inline-flex items-center px-5 py-2.5 bg-white text-indigo-700 hover:bg-slate-50 font-bold text-xs rounded-2xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
              New Task
            </button>
            <button
              onClick={() => setIsProjectDialogOpen(true)}
              className="inline-flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs rounded-2xl border border-white/20 transition-all cursor-pointer"
            >
              <FolderKanban className="w-4 h-4 mr-1.5" />
              Add Project
            </button>
            <button
              onClick={() => setIsAddFilesDialogOpen(true)}
              className="inline-flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs rounded-2xl border border-white/20 transition-all cursor-pointer"
            >
              <Paperclip className="w-4 h-4 mr-1.5" />
              Upload Files
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Tasks */}
        <Link href="/todos?status=ALL" className="group">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Tasks</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalTasks}</h3>
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +12% this week
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </Link>

        {/* Completed Tasks */}
        <Link href="/todos?status=COMPLETED" className="group">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedTasks}</h3>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {completionRate}% completion rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Link>

        {/* Pending Tasks */}
        <Link href="/todos?status=PENDING" className="group">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingTasks}</h3>
              <p className="text-[11px] font-semibold text-slate-400">
                {inProgressTasks} in progress
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Link>

        {/* Overdue Tasks */}
        <Link href="/todos" className="group">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overdue</p>
              <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{overdueTasks}</h3>
              <p className="text-[11px] font-semibold text-rose-500">
                Requires attention
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Main Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Chart & Upcoming Tasks Preview */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Chart Widget */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Task Completion & Velocity</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Weekly completion distribution chart</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Completed Tasks</span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <DashboardChart />
            </CardContent>
          </Card>

          {/* Today's & Upcoming Tasks Widget */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Active Tasks Preview</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Tasks scheduled for today and upcoming days</p>
              </div>
              <Link href="/todos" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.filter(t => t.status !== "COMPLETED").slice(0, 4).map((task: Task) => (
                  <div key={task.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        task.priority === "HIGH" ? "bg-rose-500" : task.priority === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{task.title}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {task.category || "General"} • {task.endDate || task.dueDate ? new Date(task.endDate || task.dueDate!).toLocaleDateString() : "No due date"}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      task.priority === "HIGH" ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400" :
                      task.priority === "MEDIUM" ? "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400" :
                      "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
                {tasks.filter(t => t.status !== "COMPLETED").length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">
                    🎉 No pending tasks! All caught up.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Projects + Audit Feed */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Projects Card Widget */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Workspace Projects</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">{projects.length} Active Projects</p>
              </div>
              <button
                onClick={() => setIsProjectDialogOpen(true)}
                className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors"
                title="Add Project"
              >
                <Plus className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                  No projects created yet.
                </div>
              ) : (
                projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{project.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{project.description || "Active project"}</p>
                    </div>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-600 shadow-2xs hover:bg-indigo-50 transition-colors shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Audit Stream Widget */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <Activity className="w-4 h-4 mr-2 text-indigo-600" />
                Recent Audit Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {activities.filter(a => !a.userId || a.userId === (user?.id || user?.email || "guest")).length > 0 ? (
                  activities
                    .filter(a => !a.userId || a.userId === (user?.id || user?.email || "guest"))
                    .slice(0, 4)
                    .map((act, index) => (
                      <div key={`${act.id}-${index}`} className="flex items-start space-x-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{act.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No recent activities recorded.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Dialog Modals */}
      <ProjectDialog 
        open={isProjectDialogOpen} 
        onOpenChange={(open) => {
          setIsProjectDialogOpen(open);
          if (!open) setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />

      <TodoDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        taskToEdit={null}
      />

      {/* Add Files Dialog */}
      <Dialog open={isAddFilesDialogOpen} onOpenChange={setIsAddFilesDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-indigo-600" />
              Upload Files to Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Select files or compressed zip archives to attach.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-6 text-center bg-indigo-50/30 dark:bg-indigo-950/20">
              <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">Browse & Upload Files</p>
              <label className="mt-3 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Select Files
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleSelectFiles}
                  className="hidden"
                />
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="text-xs font-semibold p-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex justify-between items-center">
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 font-bold">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={handleUploadFilesSubmit}
              disabled={isUploadingFiles || selectedFiles.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
            >
              {isUploadingFiles ? "Uploading..." : "Upload Files"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
