"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Task } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todoRepository, storageRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/FileUpload";
import { FileList } from "@/components/FileList";
import { useFileUpload } from "@/hooks/useFileUpload";
import { AlertTriangle, Send, Edit2, Trash2, Check, X } from "lucide-react";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assigneeId: z.string().optional(),
  labels: z.string().optional(),
  category: z.string().optional(),
  repeat: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  reminderSetting: z.string().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

type TodoFormValues = z.infer<typeof todoSchema>;

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: Task | null;
  initialDate?: string | null;
  initialProjectId?: string | null;
}

const toLocalISOString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getInitialStartDate = (initialDate?: string | null) => {
  if (!initialDate) return toLocalISOString(new Date());
  if (initialDate.length === 10) { // e.g. "YYYY-MM-DD" from FullCalendar month view
    const today = new Date();
    const [year, month, day] = initialDate.split("-").map(Number);
    const localDate = new Date(year, month - 1, day, today.getHours(), today.getMinutes());
    return toLocalISOString(localDate);
  }
  return toLocalISOString(new Date(initialDate));
};

export function TodoDialog({ open, onOpenChange, taskToEdit, initialDate, initialProjectId }: TodoDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!taskToEdit;
  const [newComment, setNewComment] = useState("");
  const [editingCommentIndex, setEditingCommentIndex] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [localComments, setLocalComments] = useState<string[]>([]);

  useEffect(() => {
    if (taskToEdit) {
      setLocalComments(taskToEdit.comments || []);
    } else {
      setLocalComments([]);
    }
  }, [taskToEdit, open]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "PENDING",
      startDate: getInitialStartDate(initialDate),
      endDate: "",
      assigneeId: "",
      labels: "",
      category: "Personal",
      repeat: "NONE",
      reminderSetting: "NONE",
    },
  });

  const {
    files,
    progress,
    isUploading,
    uploadFiles,
    removeFile,
    setInitialFiles,
  } = useFileUpload({
    entityType: "todo",
    entityId: taskToEdit?.id || "new",
    maxFiles: 10,
  });

  useEffect(() => {
    if (taskToEdit) {
      const formattedStartDate = taskToEdit.startDate
        ? toLocalISOString(new Date(taskToEdit.startDate))
        : "";
      const formattedEndDate = taskToEdit.endDate
        ? toLocalISOString(new Date(taskToEdit.endDate))
        : (taskToEdit.dueDate ? toLocalISOString(new Date(taskToEdit.dueDate)) : "");

      const rruleReverseMap: Record<string, "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"> = {
        "FREQ=DAILY": "DAILY",
        "FREQ=WEEKLY": "WEEKLY",
        "FREQ=MONTHLY": "MONTHLY",
        "FREQ=YEARLY": "YEARLY",
      };

      reset({
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        priority: taskToEdit.priority as "LOW" | "MEDIUM" | "HIGH",
        status: taskToEdit.status as "PENDING" | "IN_PROGRESS" | "COMPLETED",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        assigneeId: taskToEdit.assigneeId || "",
        labels: taskToEdit.labels ? taskToEdit.labels.join(", ") : "",
        category: taskToEdit.category || "Personal",
        repeat: rruleReverseMap[taskToEdit.recurrenceRule || ""] || "NONE",
        reminderSetting: taskToEdit.reminderSetting || "NONE",
      });
      setInitialFiles(taskToEdit.attachments ? taskToEdit.attachments.map(att => ({
          id: att.key,
          key: att.key,
          name: att.name,
          size: att.size,
          type: att.type,
          url: "",
          entityType: "todo",
          entityId: taskToEdit.id,
          createdAt: taskToEdit.createdAt,
      })) : []);
    } else {
      reset({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "PENDING",
        startDate: getInitialStartDate(initialDate),
        endDate: "",
        assigneeId: "",
        labels: "",
        category: "Personal",
        repeat: "NONE",
        reminderSetting: "NONE",
      });
      setInitialFiles([]);
    }
  }, [taskToEdit, reset, open, initialDate, setInitialFiles]);

  const mutation = useMutation({
    mutationFn: async (data: TodoFormValues) => {
      const parsedLabels = data.labels
        ? data.labels.split(",").map((l) => l.trim()).filter(Boolean)
        : [];

      const attachments = files.length > 0 ? files.map(file => ({
        key: file.key,
        name: file.name,
        type: file.type,
        size: file.size,
      })) : undefined;

      const rruleMap: Record<string, string | null> = {
        NONE: null,
        DAILY: "FREQ=DAILY",
        WEEKLY: "FREQ=WEEKLY",
        MONTHLY: "FREQ=MONTHLY",
        YEARLY: "FREQ=YEARLY",
      };

      const submitData: any = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        dueDate: data.endDate ? new Date(data.endDate).toISOString() : (data.startDate ? new Date(data.startDate).toISOString() : undefined),
        assigneeId: data.assigneeId,
        labels: parsedLabels,
        attachments,
        recurrenceRule: rruleMap[data.repeat || "NONE"],
        reminderSetting: data.reminderSetting !== "NONE" ? data.reminderSetting : undefined,
        projectId: initialProjectId,
        comments: isEditing ? (taskToEdit?.comments || localComments) : localComments
      };

      if (isEditing && taskToEdit) {
        return todoRepository.updateTask(taskToEdit.id, submitData);
      } else {
        return todoRepository.createTask({
          ...submitData,
          userId: user?.id || "unknown",
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(isEditing ? "Task updated" : "Task created");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (taskToEdit) {
        await todoRepository.deleteTask(taskToEdit.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to delete task");
    }
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const onSubmit = (data: TodoFormValues) => {
    mutation.mutate(data);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentText = `${user?.name || 'User'}: ${newComment.trim()}`;

    if (isEditing && taskToEdit) {
      const existingComments = taskToEdit.comments || [];
      const updatedComments = [...existingComments, commentText];
      todoRepository.updateTask(taskToEdit.id, { comments: updatedComments }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success("Comment added");
        setNewComment("");
      });
    } else {
      setLocalComments(prev => [...prev, commentText]);
      setNewComment("");
    }
  };

  const handleDeleteComment = (indexToDelete: number) => {
    if (isEditing && taskToEdit && taskToEdit.comments) {
      const updatedComments = taskToEdit.comments.filter((_, idx) => idx !== indexToDelete);
      todoRepository.updateTask(taskToEdit.id, { comments: updatedComments }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success("Comment deleted");
      });
    } else {
      setLocalComments(prev => prev.filter((_, idx) => idx !== indexToDelete));
    }
  };

  const handleStartEditComment = (index: number, text: string) => {
    setEditingCommentIndex(index);
    const textContent = text.includes(":") ? text.split(":").slice(1).join(":").trim() : text;
    setEditingCommentText(textContent);
  };

  const handleSaveEditComment = (indexToEdit: number) => {
    if (!editingCommentText.trim()) return;
    const activeList = isEditing && taskToEdit ? (taskToEdit.comments || localComments) : localComments;
    const original = activeList[indexToEdit] || "";
    const authorPrefix = original.includes(":") ? original.split(":")[0] : (user?.name || "User");
    const updatedText = `${authorPrefix}: ${editingCommentText.trim()}`;

    if (isEditing && taskToEdit) {
      const updatedComments = activeList.map((c, idx) => idx === indexToEdit ? updatedText : c);
      todoRepository.updateTask(taskToEdit.id, { comments: updatedComments }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success("Comment updated");
        setEditingCommentIndex(null);
        setEditingCommentText("");
      });
    } else {
      setLocalComments(prev => prev.map((c, idx) => idx === indexToEdit ? updatedText : c));
      setEditingCommentIndex(null);
      setEditingCommentText("");
    }
  };

  const handleFilesSelected = async (fileList: FileList) => {
    try {
      await uploadFiles(fileList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleDownloadFile = async (fileKey: string) => {
    try {
      const url = await storageRepository.getFileUrl(fileKey);
      window.open(url, '_blank');
    } catch (error) {
      toast.error("Failed to get download link");
    }
  };

  const handleDeleteFile = async (fileKey: string) => {
    try {
      await removeFile(fileKey);
      toast.success("File removed");
    } catch (error) {
      toast.error("Failed to remove file");
    }
  };

  const isOverdue = taskToEdit && taskToEdit.status !== "COMPLETED" && (
    (taskToEdit.dueDate && new Date(taskToEdit.dueDate).getTime() < new Date().getTime()) ||
    (taskToEdit.startDate && new Date(taskToEdit.startDate).getTime() < new Date().getTime())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${isOverdue ? 'border-2 border-red-500' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isEditing ? "Edit Task" : "Create Task"}
            {isOverdue && <AlertTriangle className="w-5 h-5 ml-2 text-red-500" />}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Title</Label>
              <input
                id="title"
                {...register("title")}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="E.g. Fix the navigation bug"
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register("description")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Optional details..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register("priority")}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register("status")}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="PENDING">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="repeat">Repeat</Label>
              <select
                id="repeat"
                {...register("repeat")}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="NONE">Does not repeat</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register("category")}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Finance">Finance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time</Label>
              <input
                id="startDate"
                type="datetime-local"
                {...register("startDate")}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time</Label>
              <input
                id="endDate"
                type="datetime-local"
                {...register("endDate")}
                className={`flex h-10 w-full rounded-md border ${errors.endDate ? 'border-red-500' : 'border-input'} bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <input
                id="assigneeId"
                {...register("assigneeId")}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Assignee email or ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labels">Labels</Label>
              <input
                id="labels"
                {...register("labels")}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Comma separated (e.g. bug, frontend)"
              />
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-3 pt-2">
            <Label>Attachments</Label>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              progress={progress}
              isUploading={isUploading}
              disabled={mutation.isPending}
            />
            <FileList
              files={files as any}
              onDownload={handleDownloadFile}
              onDelete={handleDeleteFile}
              disabled={mutation.isPending}
            />
          </div>

          <DialogFooter className="mt-6 border-t pt-4 flex sm:justify-between w-full">
            <div className="flex-1">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md transition-colors"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || isUploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </DialogFooter>
        </form>

        {/* Comments Section (Available in both Create and Edit modes) */}
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3">Comments</h3>
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
            {(isEditing && taskToEdit?.comments ? taskToEdit.comments : localComments).length > 0 ? (
              (isEditing && taskToEdit?.comments ? taskToEdit.comments : localComments).map((comment, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-xl group transition-all">
                  {editingCommentIndex === index ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditComment(index)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCommentIndex(null)}
                        className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-slate-800 dark:text-slate-200 text-xs font-medium min-w-0 truncate pr-2">
                        {comment}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditComment(index, comment)}
                          className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors cursor-pointer"
                          title="Edit Comment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(index)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No comments yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
