"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { todoRepository, projectRepository, storageRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import { Task, Project, Attachment } from "@/types";
import { useActivity } from "@/providers/ActivityProvider";
import toast from "react-hot-toast";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Folder, 
  FileText, 
  Edit2, 
  Trash2, 
  Calendar, 
  ChevronDown, 
  MoreVertical, 
  Bell, 
  CheckSquare, 
  Paperclip, 
  UploadCloud, 
  X, 
  Activity,
  AlertCircle
} from "lucide-react";
import { ProjectDialog } from "@/components/ProjectDialog";
import { TodoDialog } from "@/components/TodoDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activities, logActivity, clearActivities, removeActivity } = useActivity();

  // Modal & Dropdown States
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isAddFilesDialogOpen, setIsAddFilesDialogOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTaskTab, setActiveTaskTab] = useState<"ALL" | "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED">("ALL");

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpeg,.jpg,.png,.webp,.mp3,.wav,.mp4,.mov,.avi,.zip,.rar";

  // Data Fetching
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectRepository.getProjects(),
  });

  // Task Status Toggle Mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      const updated = await todoRepository.updateTask(task.id, { status: newStatus });
      return { updated, newStatus };
    },
    onSuccess: ({ updated, newStatus }, task) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      logActivity({
        id: task.id,
        title: task.title,
        type: "task",
        status: newStatus,
        subtitle: newStatus === "COMPLETED" ? "Task completed" : "Task marked pending",
        href: "/todos"
      });
      toast.success(newStatus === "COMPLETED" ? "Task marked completed!" : "Task marked pending!");
    },
    onError: () => {
      toast.error("Failed to update task status");
    }
  });

  // Handle Drag & Drop Files
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUploadFilesSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    try {
      setIsUploadingFiles(true);
      for (const file of selectedFiles) {
        const result = await storageRepository.uploadFile(file, "Global", user?.id || "anonymous");
        const formattedSize = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;
        logActivity({
          id: result.key || file.name,
          title: file.name,
          type: "file",
          subtitle: `${formattedSize} • Workspace File`,
          href: "/files"
        });
      }
      toast.success("Files uploaded successfully!");
      setSelectedFiles([]);
      setIsAddFilesDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload files");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Calculations for Stat Cards & Donut Chart
  const now = new Date();
  const nowTime = now.getTime();
  const todayStr = now.toISOString().split("T")[0];

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === "COMPLETED").length;
  const inProgressCount = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const pendingCount = tasks.filter(t => t.status === "PENDING").length;

  const startOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const overdueCount = useMemo(() => {
    return tasks.filter(t => {
      if (t.status === "COMPLETED") return false;
      const dueRaw = t.dueDate || t.endDate;
      if (!dueRaw) return false;
      const dueMs = new Date(dueRaw).getTime();
      return dueMs < startOfTodayMs;
    }).length;
  }, [tasks, startOfTodayMs]);

  const effectiveTotal = tasks.length;
  const completedPct = effectiveTotal > 0 ? ((completedCount / effectiveTotal) * 100).toFixed(0) : "0";
  const inProgressPct = effectiveTotal > 0 ? ((inProgressCount / effectiveTotal) * 100).toFixed(0) : "0";
  const pendingPct = effectiveTotal > 0 ? ((pendingCount / effectiveTotal) * 100).toFixed(0) : "0";

  const donutData = effectiveTotal > 0 ? [
    { name: "Completed", value: completedCount, color: "#22c55e" },
    { name: "In Progress", value: inProgressCount, color: "#3b82f6" },
    { name: "Pending", value: pendingCount, color: "#eab308" },
  ] : [
    { name: "Empty", value: 1, color: "#e2e8f0" }
  ];

  // Upcoming Deadlines List
  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter(t => t.status !== "COMPLETED" && (t.endDate || t.dueDate || t.startDate))
      .map(t => {
        const dateRaw = t.endDate || t.dueDate || t.startDate;
        const targetTime = new Date(dateRaw!).getTime();
        const diffMs = targetTime - nowTime;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let badge = "";
        let color = "bg-purple-100 text-purple-700";

        if (diffDays < 0) {
          badge = `Overdue by ${Math.abs(diffDays)}d`;
          color = "bg-red-100 text-red-600";
        } else if (diffDays === 0) {
          badge = "Due Today";
          color = "bg-red-100 text-red-600";
        } else if (diffDays === 1) {
          badge = "Tomorrow";
          color = "bg-amber-100 text-amber-700";
        } else {
          badge = `${diffDays} days left`;
          color = diffDays <= 3 ? "bg-red-100 text-red-600" : diffDays <= 5 ? "bg-sky-100 text-sky-700" : "bg-purple-100 text-purple-700";
        }

        const dateFormatted = new Date(dateRaw!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

        return {
          id: t.id,
          title: t.title,
          dateStr: dateFormatted,
          badge,
          color,
          rawTask: t,
        };
      })
      .slice(0, 4);
  }, [tasks, nowTime]);

  // Recent Activity Feed
  const recentActivitiesList = useMemo(() => {
    return activities.slice(0, 5).map(act => {
      let icon = CheckSquare;
      let iconBg = "bg-purple-600 text-white";
      let badgeColor = "bg-purple-100 text-purple-700";
      let badge = "Task Created";

      if (act.type === "project") {
        icon = Folder;
        iconBg = "bg-sky-500 text-white";
        badgeColor = "bg-sky-100 text-sky-700";
        badge = "Project Created";
      } else if (act.type === "file") {
        icon = FileText;
        iconBg = "bg-purple-600 text-white";
        badgeColor = "bg-purple-100 text-purple-700";
        badge = "File Uploaded";
      } else if (act.status === "COMPLETED") {
        icon = CheckCircle2;
        iconBg = "bg-emerald-500 text-white";
        badgeColor = "bg-emerald-100 text-emerald-700";
        badge = "Task Completed";
      } else if (act.title.toLowerCase().includes("reminder")) {
        icon = Bell;
        iconBg = "bg-amber-500 text-white";
        badgeColor = "bg-amber-100 text-amber-700";
        badge = "Reminder Triggered";
      } else {
        icon = Edit2;
        iconBg = "bg-blue-500 text-white";
        badgeColor = "bg-blue-100 text-blue-700";
        badge = "Task Updated";
      }

      const minutes = Math.max(1, Math.floor((nowTime - new Date(act.timestamp).getTime()) / (1000 * 60)));
      const timeStr = minutes < 60 ? `${minutes} minute${minutes === 1 ? "" : "s"} ago` : `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) === 1 ? "" : "s"} ago`;

      return {
        id: act.id,
        title: act.title,
        subtitle: act.subtitle || "Workspace update",
        time: timeStr,
        badge,
        badgeColor,
        iconBg,
        icon,
      };
    });
  }, [activities, nowTime]);

  // Filtered Tasks for My Tasks section
  const filteredMyTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeTaskTab === "ALL") return true;
      if (activeTaskTab === "COMPLETED") return t.status === "COMPLETED";
      if (activeTaskTab === "TODAY") {
        const dueStr = t.dueDate ? t.dueDate.slice(0, 10) : "";
        const startStr = t.startDate ? t.startDate.slice(0, 10) : "";
        const createdStr = t.createdAt ? t.createdAt.slice(0, 10) : "";
        return dueStr === todayStr || startStr === todayStr || createdStr === todayStr;
      }
      if (activeTaskTab === "UPCOMING") {
        const due = t.endDate || t.dueDate;
        return t.status !== "COMPLETED" && due && new Date(due).getTime() >= nowTime;
      }
      if (activeTaskTab === "OVERDUE") {
        const due = t.endDate || t.dueDate;
        return t.status !== "COMPLETED" && due && new Date(due).getTime() < nowTime;
      }
      return true;
    });
  }, [tasks, activeTaskTab, todayStr, nowTime]);

  const getPriorityPill = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <span className="bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">High</span>;
      case "MEDIUM":
        return <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">Medium</span>;
      case "LOW":
        return <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">Low</span>;
      default:
        return null;
    }
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-purple-600 dark:text-purple-400 font-bold text-sm animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6 pb-8 min-h-0 text-slate-800 dark:text-slate-200">

      {/* 1. Header Section - Dynamic Welcome back with User Name */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || "Niharika"}! 👋
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your tasks today.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskDialogOpen(true);
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Stat Cards Grid: Total Tasks, Completed, Pending, In Progress */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Tasks */}
        <Link href="/todos?status=ALL" className="block">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Total Tasks</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{totalTasks}</span>
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5">All tasks</span>
            </div>
          </div>
        </Link>

        {/* Card 2: Completed */}
        <Link href="/todos?status=COMPLETED" className="block">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Completed</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{completedCount}</span>
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5">This month</span>
            </div>
          </div>
        </Link>

        {/* Card 3: Pending */}
        <Link href="/todos?status=PENDING" className="block">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Pending</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{pendingCount}</span>
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5">Still to do</span>
            </div>
          </div>
        </Link>

        {/* Card 4: In Progress */}
        <Link href="/todos?status=IN_PROGRESS" className="block">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">In Progress</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{inProgressCount}</span>
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5">In progress</span>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Middle Section: 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Tasks Overview Card - Circle Chart centered, Data UNDER/BELOW circle */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Tasks Overview</h3>

          <div className="flex flex-col items-center justify-center my-auto space-y-4">
            {/* Donut Circle Chart Centered */}
            <div className="relative w-40 h-40 flex items-center justify-center mx-auto shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{effectiveTotal}</span>
                <span className="text-[11px] font-semibold text-slate-400 mt-1">Total</span>
              </div>
            </div>

            {/* Data items UNDER / BELOW the circle */}
            <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-1 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Completed</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {completedCount} <span className="text-[10px] font-normal text-slate-400">({completedPct}%)</span>
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>In Progress</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {inProgressCount} <span className="text-[10px] font-normal text-slate-400">({inProgressPct}%)</span>
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Pending</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {pendingCount} <span className="text-[10px] font-normal text-slate-400">({pendingPct}%)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
            <Link href="/calendar" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">View all</Link>
          </div>

          <div className="space-y-3 my-auto">
            {upcomingDeadlines.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  if (item.rawTask) {
                    setTaskToEdit(item.rawTask);
                    setIsTaskDialogOpen(true);
                  }
                }}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.dateStr}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${item.color}`}>
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <div className="flex items-center gap-3">
              {activities.length > 0 && (
                <button
                  onClick={clearActivities}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                  title="Clear all activity history"
                >
                  Clear history
                </button>
              )}
              <Link href="/todos" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">View all</Link>
            </div>
          </div>

          <div className="relative pl-6 space-y-3.5 my-auto border-l-2 border-slate-100 dark:border-slate-800 ml-3 py-1">
            {recentActivitiesList.length > 0 ? (
              recentActivitiesList.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative flex items-center justify-between text-xs group">
                    <div className={`absolute -left-[31px] w-6 h-6 rounded-full ${item.iconBg} flex items-center justify-center shadow-xs text-white`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 pr-2">
                      <h5 className="font-bold text-slate-800 dark:text-white truncate text-xs leading-tight">{item.title}</h5>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{item.subtitle}</p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">{item.time}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <button
                        onClick={() => removeActivity(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                        title="Remove activity entry"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: My Tasks */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Tasks</h3>
          <Link href="/todos" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">View all</Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-6 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold mb-4">
          <button
            onClick={() => setActiveTaskTab("ALL")}
            className={`pb-2.5 transition-all cursor-pointer ${
              activeTaskTab === "ALL"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTaskTab("TODAY")}
            className={`pb-2.5 transition-all cursor-pointer ${
              activeTaskTab === "TODAY"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTaskTab("UPCOMING")}
            className={`pb-2.5 transition-all cursor-pointer ${
              activeTaskTab === "UPCOMING"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTaskTab("OVERDUE")}
            className={`pb-2.5 transition-all cursor-pointer ${
              activeTaskTab === "OVERDUE"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setActiveTaskTab("COMPLETED")}
            className={`pb-2.5 transition-all cursor-pointer ${
              activeTaskTab === "COMPLETED"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Task Rows List */}
        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {filteredMyTasks.length > 0 ? (
            filteredMyTasks.map((t: any) => {
              const isCompleted = t.status === "COMPLETED";
              return (
                <div key={t.id} className="py-3 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 pr-3">
                    <button
                      onClick={() => toggleTaskMutation.mutate(t)}
                      className="cursor-pointer text-slate-300 hover:text-purple-600 transition-colors shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-purple-600 fill-purple-600/10" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-purple-600 transition-colors" />
                      )}
                    </button>
                    <span className={`text-xs font-bold truncate ${isCompleted ? "line-through text-slate-400" : "text-slate-800 dark:text-white"}`}>
                      {t.title}
                    </span>
                    {getPriorityPill(t.priority)}
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-slate-400 shrink-0 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {(() => {
                          const startStr = t.startDate ? new Date(t.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
                          const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
                          if (startStr && dueStr && t.startDate.slice(0, 10) !== t.dueDate.slice(0, 10)) {
                            return `Created: ${startStr} • Due: ${dueStr}`;
                          }
                          return dueStr ? `Due: ${dueStr}` : (startStr ? `Created: ${startStr}` : "No due date");
                        })()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setTaskToEdit(t);
                        setIsTaskDialogOpen(true);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Edit task"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-slate-400 font-medium">
              No tasks found for this filter tab.
            </div>
          )}
        </div>
      </div>

      {/* Modals & Dialogs */}
      <TodoDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      <ProjectDialog 
        open={isProjectDialogOpen} 
        onOpenChange={(open) => {
          setIsProjectDialogOpen(open);
          if (!open) setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />

      {/* Upload File Dialog */}
      <Dialog open={isAddFilesDialogOpen} onOpenChange={setIsAddFilesDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-purple-600" />
              Upload Workspace Files
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Select files or documents to attach to your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed border-purple-200 dark:border-purple-900/50 rounded-2xl p-6 text-center bg-purple-50/40 dark:bg-purple-950/20">
              <UploadCloud className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">Choose files to upload</p>
              <label className="mt-3 inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs">
                <span>Browse Files</span>
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
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                    <span className="font-semibold truncate">{f.name}</span>
                    <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button onClick={() => setIsAddFilesDialogOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl">
              Cancel
            </button>
            <button onClick={handleUploadFilesSubmit} disabled={isUploadingFiles || selectedFiles.length === 0} className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50">
              {isUploadingFiles ? "Uploading..." : "Upload"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
