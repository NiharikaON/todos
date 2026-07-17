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
import { AlertTriangle, Send } from "lucide-react";

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

export function TodoDialog({ open, onOpenChange, taskToEdit, initialDate, initialProjectId }: TodoDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!taskToEdit;
  const [newComment, setNewComment] = useState("");

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
      startDate: initialDate ? toLocalISOString(new Date(initialDate)) : "",
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
    if (open) {
      if (taskToEdit) {
        reset({
          title: taskToEdit.title,
          description: taskToEdit.description || "",
          priority: taskToEdit.priority as "LOW" | "MEDIUM" | "HIGH",
          status: taskToEdit.status as "PENDING" | "IN_PROGRESS" | "COMPLETED",
          startDate: taskToEdit.startDate ? toLocalISOString(new Date(taskToEdit.startDate)) : "",
          endDate: taskToEdit.endDate ? toLocalISOString(new Date(taskToEdit.endDate)) : "",
          assigneeId: taskToEdit.assigneeId || "",
          labels: taskToEdit.labels?.join(", ") || "",
          category: taskToEdit.category || "Personal",
          repeat: (taskToEdit.recurrenceRule ? taskToEdit.recurrenceRule.replace("FREQ=", "") as any : "NONE") || "NONE",
          reminderSetting: taskToEdit.reminderSetting || "NONE",
        });
        
        const initialFiles = taskToEdit.attachments ? taskToEdit.attachments.map(att => ({
          id: att.key,
          key: att.key,
          name: att.name,
          size: att.size,
          type: att.type,
          url: "",
          entityType: "todo",
          entityId: taskToEdit.id,
          createdAt: taskToEdit.createdAt,
        })) : [];
        setInitialFiles(initialFiles);
      } else {
        const dateValue = initialDate ? toLocalISOString(new Date(initialDate)) : "";
        reset({
          title: "",
          description: "",
          priority: "MEDIUM",
          status: "PENDING",
          startDate: dateValue,
          endDate: "",
          assigneeId: "",
          labels: "",
          repeat: "NONE",
        });
        setInitialFiles([]);
      }
      setNewComment("");
    }
  }, [open, taskToEdit, initialDate, reset, setInitialFiles]);

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const mutation = useMutation({
    mutationFn: (data: TodoFormValues & { comments?: string[] }) => {
      const attachments = files.length > 0 ? files.map(file => ({
        key: file.key,
        name: file.name,
        type: file.type,
        size: file.size,
      })) : undefined;

      const parsedLabels = data.labels ? data.labels.split(",").map(l => l.trim()).filter(Boolean) : [];
      if (data.category) {
        if (!parsedLabels.includes(data.category)) {
          parsedLabels.unshift(data.category);
        }
      }

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
        projectId: initialProjectId, // Pass the project ID if provided
        ...(data.comments && { comments: data.comments })
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
    if (!newComment.trim() || !taskToEdit) return;
    const existingComments = taskToEdit.comments || [];
    const updatedComments = [...existingComments, `${user?.name || 'User'}: ${newComment.trim()}`];
    
    // Instead of calling mutation directly, just optimistic update or real update
    todoRepository.updateTask(taskToEdit.id, { comments: updatedComments }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Comment added");
      setNewComment("");
      // Update local state if needed, but react-query will refetch and dialog should update if taskToEdit is bound to query
    });
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
            
            <div className="space-y-2 col-span-2 sm:col-span-1">
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
            
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="reminderSetting">Reminder</Label>
              <select
                id="reminderSetting"
                {...register("reminderSetting")}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="NONE">No reminder</option>
                <option value="0_MIN">At due time</option>
                <option value="1_MIN">1 minute before</option>
                <option value="5_MIN">5 minutes before</option>
                <option value="15_MIN">15 minutes before</option>
                <option value="30_MIN">30 minutes before</option>
                <option value="1_HOUR">1 hour before</option>
                <option value="1_DAY">1 day before</option>
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

        {/* Comments Section (Only in Edit mode) */}
        {isEditing && taskToEdit && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Comments</h3>
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {taskToEdit.comments && taskToEdit.comments.length > 0 ? (
                taskToEdit.comments.map((comment, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {comment}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
