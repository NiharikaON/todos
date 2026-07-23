"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoRepository, storageRepository } from "@/repositories";
import { Task, Attachment } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { TodoDialog } from "@/components/TodoDialog";
import { FilePreviewGallery } from "@/components/FilePreviewGallery";
import { downloadFileDirectly } from "@/utils/download";
import toast from "react-hot-toast";
import { 
  StickyNote, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar, 
  Clock, 
  Paperclip, 
  MessageSquare, 
  Download, 
  Eye, 
  Tag, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function NotesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [galleryAttachments, setGalleryAttachments] = useState<Attachment[]>([]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => todoRepository.getTasks(),
    enabled: !!user?.id,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => todoRepository.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Note deleted");
    },
    onError: () => {
      toast.error("Failed to delete note");
    },
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.comments?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === "ALL" || (t.category || "Personal") === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [tasks, searchQuery, selectedCategory]);

  const handleDownloadAttachment = async (att: Attachment) => {
    try {
      const url = await storageRepository.getFileUrl(att.key);
      await downloadFileDirectly(url, att.name);
    } catch (err) {
      toast.error("Failed to download file");
    }
  };

  const handlePreviewAttachment = (att: Attachment, allTaskAtts: Attachment[]) => {
    setGalleryAttachments(allTaskAtts);
    setPreviewAttachment(att);
  };

  const noteThemes = [
    { bg: "bg-amber-50/90 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-100", tag: "bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200" },
    { bg: "bg-purple-50/90 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-100", tag: "bg-purple-200/60 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200" },
    { bg: "bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100", tag: "bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200" },
    { bg: "bg-sky-50/90 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/50 text-sky-900 dark:text-sky-100", tag: "bg-sky-200/60 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200" },
    { bg: "bg-rose-50/90 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-100", tag: "bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200" },
  ];

  return (
    <div className="flex-1 space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <StickyNote className="w-8 h-8 mr-3 text-amber-500" />
            Sticky Notes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View full details, descriptions, comments, and attachments for all your tasks in visual sticky notes.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedTaskToEdit(null);
            setIsDialogOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm shadow-amber-200 dark:shadow-none transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          Create Note / Task
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sticky notes by title, description, or comment..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700 dark:text-slate-200"
        >
          <option value="ALL">All Categories</option>
          <option value="Personal">Personal</option>
          <option value="Work">Work</option>
          <option value="Shopping">Shopping</option>
          <option value="Health">Health</option>
          <option value="Finance">Finance</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Sticky Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs text-center p-6">
          <StickyNote className="w-12 h-12 text-amber-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No sticky notes found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchQuery || selectedCategory !== "ALL"
              ? "Try adjusting your search or category filter"
              : "Click '+ Create Note / Task' to create your first sticky note!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task, idx) => {
            const theme = noteThemes[idx % noteThemes.length];
            const isOverdue = task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate).getTime() < new Date().getTime();

            return (
              <div
                key={task.id}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${theme.bg}`}
              >
                {/* Top Bar */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base leading-snug break-words">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedTaskToEdit(task);
                          setIsDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                        title="Edit Note"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete sticky note "${task.title}"?`)) {
                            deleteTaskMutation.mutate(task.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] font-semibold">
                    <span className={`px-2 py-0.5 rounded-md ${theme.tag}`}>
                      {task.category || "Personal"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md ${
                      task.priority === "HIGH" ? "bg-red-500 text-white" :
                      task.priority === "MEDIUM" ? "bg-amber-500 text-white" :
                      "bg-emerald-500 text-white"
                    }`}>
                      {task.priority || "LOW"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md ${
                      task.status === "COMPLETED" ? "bg-emerald-600 text-white" :
                      task.status === "IN_PROGRESS" ? "bg-purple-600 text-white" :
                      "bg-blue-600 text-white"
                    }`}>
                      {task.status === "PENDING" ? "Todo" : task.status === "IN_PROGRESS" ? "In Progress" : "Completed"}
                    </span>
                  </div>

                  {/* Full Description */}
                  {task.description ? (
                    <div className="text-xs leading-relaxed whitespace-pre-line mb-4 font-normal opacity-90">
                      {task.description}
                    </div>
                  ) : (
                    <p className="text-xs italic opacity-60 mb-4">No description provided.</p>
                  )}

                  {/* Dates */}
                  {(task.startDate || task.endDate || task.dueDate) && (
                    <div className="flex items-center gap-3 text-[11px] opacity-80 mb-3 font-medium">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {task.startDate && `Start: ${new Date(task.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                        {task.startDate && (task.endDate || task.dueDate) && " • "}
                        {(task.endDate || task.dueDate) && `Due: ${new Date(task.endDate || task.dueDate!).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                  )}

                  {/* Comments Section */}
                  {task.comments && task.comments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-1.5">
                      <p className="text-[11px] font-bold flex items-center opacity-85">
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        Comments ({task.comments.length})
                      </p>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {task.comments.map((cmt, cIdx) => (
                          <div key={cIdx} className="text-[11px] p-1.5 rounded-lg bg-black/5 dark:bg-white/5 font-medium leading-snug">
                            {cmt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachments Section */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-1.5">
                      <p className="text-[11px] font-bold flex items-center opacity-85">
                        <Paperclip className="w-3.5 h-3.5 mr-1" />
                        Attachments ({task.attachments.length})
                      </p>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {task.attachments.map((att, aIdx) => (
                          <div key={aIdx} className="flex items-center justify-between p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-[11px]">
                            <span className="truncate pr-2 font-medium">{att.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handlePreviewAttachment(att, task.attachments!)}
                                className="p-1 hover:bg-black/10 rounded"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownloadAttachment(att)}
                                className="p-1 hover:bg-black/10 rounded"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Overdue alert indicator */}
                {isOverdue && (
                  <div className="mt-4 pt-2 border-t border-red-300 dark:border-red-800/50 flex items-center text-red-600 dark:text-red-400 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                    Overdue Task
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal for Create / Edit */}
      <TodoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        taskToEdit={selectedTaskToEdit}
      />

      {/* File Preview Modal */}
      <FilePreviewGallery
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachments={galleryAttachments}
        initialAttachment={previewAttachment || undefined}
      />
    </div>
  );
}
