"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Task, ChecklistItem, TaskType } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todoRepository, storageRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/FileUpload";
import { FileList } from "@/components/FileList";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useActivity } from "@/providers/ActivityProvider";
import { scheduleTaskReminderNotification } from "@/utils/reminders";
import { 
  calculateNextOneTimeReminder, 
  calculateNextRepeatingReminder, 
  calculateNextOccurrenceDate 
} from "@/utils/reminderEngine";
import { 
  Trash2, 
  X, 
  Star, 
  Calendar, 
  Clock, 
  Tag, 
  CheckSquare, 
  Repeat, 
  Bell, 
  Folder, 
  StickyNote, 
  Paperclip, 
  Plus, 
  RotateCcw,
  Sparkles,
  CheckCircle2,
  FileText,
  ArrowLeft
} from "lucide-react";

const todoSchema = z.object({
  title: z.string().min(1, "Task title is required").max(100, "Title cannot exceed 100 characters"),
  description: z.string().optional(),
  category: z.enum([
    "Personal",
    "Work",
    "Health",
    "Finance",
    "Shopping",
    "Study",
    "Others",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  startTime: z.string().optional(),
  dueTime: z.string().optional(),
  reminderType: z.enum(["NONE", "ONE_TIME", "REPEATING"]),
  reminderSetting: z.enum([
    "NONE",
    "AT_DUE_TIME",
    "5_MIN",
    "15_MIN",
    "30_MIN",
    "1_HOUR",
    "1_DAY",
  ]),
  reminderInterval: z.enum(["30_MIN", "1_HOUR", "2_HOURS", "3_HOURS", "4_HOURS", "CUSTOM"]).optional(),
  customReminderIntervalMinutes: z.number().optional(),
  reminderStartTime: z.string().optional(),
  reminderEndTime: z.string().optional(),
  repeat: z.enum(["NONE", "DAILY", "WEEKDAYS", "WEEKLY", "MONTHLY", "YEARLY"]),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.dueDate) {
    const start = new Date(data.startDate).getTime();
    const due = new Date(data.dueDate).getTime();
    return due >= start;
  }
  return true;
}, {
  message: "Due Date cannot be earlier than Start Date",
  path: ["dueDate"],
});

type TodoFormValues = z.infer<typeof todoSchema>;

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: Task | null;
  initialDate?: string | null;
  initialProjectId?: string | null;
}

const getTodayDateString = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

export function TodoDialog({
  open,
  onOpenChange,
  taskToEdit,
  initialDate,
  initialProjectId,
}: TodoDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logActivity } = useActivity();
  const isEditing = !!taskToEdit;

  // Wizard State
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType>("ONE_TIME");
  const [dayOfWeek, setDayOfWeek] = useState<string>("Friday");
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  // Additional Interactive State
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  // Comments State
  const [localComments, setLocalComments] = useState<string[]>([]);

  const defaultFormValues: TodoFormValues = {
    title: "",
    description: "",
    category: "Personal",
    priority: "MEDIUM",
    status: "PENDING",
    startDate: "",
    dueDate: "",
    startTime: "",
    dueTime: "",
    reminderType: "NONE",
    reminderSetting: "NONE",
    reminderInterval: "2_HOURS",
    customReminderIntervalMinutes: 60,
    reminderStartTime: "08:00",
    reminderEndTime: "22:00",
    repeat: "NONE",
    notes: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    mode: "onChange",
    defaultValues: defaultFormValues,
  });

  const watchTitle = watch("title") || "";

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

  // Load Task values into form when editing or opening
  useEffect(() => {
    if (open) {
      if (taskToEdit) {
        setStep(2);
        let tType: TaskType = (taskToEdit.taskType as any) || "ONE_TIME";
        if (!taskToEdit.taskType) {
          if (taskToEdit.repeat === "DAILY" || taskToEdit.recurrenceRule === "FREQ=DAILY") tType = "DAILY";
          else if (taskToEdit.repeat === "WEEKLY" || taskToEdit.recurrenceRule === "FREQ=WEEKLY") tType = "WEEKLY";
          else if (taskToEdit.repeat === "MONTHLY" || taskToEdit.recurrenceRule === "FREQ=MONTHLY") tType = "MONTHLY";
          else if (taskToEdit.repeat === "YEARLY" || taskToEdit.recurrenceRule === "FREQ=YEARLY") tType = "YEARLY";
        }
        setSelectedTaskType(tType);

        if (taskToEdit.dayOfWeek) setDayOfWeek(String(taskToEdit.dayOfWeek));
        if (taskToEdit.dayOfMonth) setDayOfMonth(Number(taskToEdit.dayOfMonth));

        setIsFavorite(!!taskToEdit.isFavorite);
        setChecklist(taskToEdit.checklist || []);
        setTags(taskToEdit.labels || []);
        setLocalComments(taskToEdit.comments || []);

        const rruleReverseMap: Record<string, "NONE" | "DAILY" | "WEEKDAYS" | "WEEKLY" | "MONTHLY" | "YEARLY"> = {
          "FREQ=DAILY": "DAILY",
          "FREQ=WEEKDAYS": "WEEKDAYS",
          "FREQ=WEEKLY": "WEEKLY",
          "FREQ=MONTHLY": "MONTHLY",
          "FREQ=YEARLY": "YEARLY",
        };

        let startDateVal = taskToEdit.startDate ? taskToEdit.startDate.slice(0, 10) : "";
        let dueDateVal = taskToEdit.dueDate ? taskToEdit.dueDate.slice(0, 10) : taskToEdit.endDate ? taskToEdit.endDate.slice(0, 10) : "";

        reset({
          title: taskToEdit.title,
          description: taskToEdit.description || "",
          category: (taskToEdit.category as any) || "Personal",
          priority: (taskToEdit.priority as any) || "MEDIUM",
          status: (taskToEdit.status as any) || "PENDING",
          startDate: startDateVal,
          dueDate: dueDateVal,
          startTime: taskToEdit.startTime || "",
          dueTime: taskToEdit.dueTime || "",
          reminderType: (taskToEdit.reminderType as any) || "NONE",
          reminderSetting: (taskToEdit.reminderSetting as any) || "NONE",
          reminderInterval: (taskToEdit.reminderInterval as any) || "2_HOURS",
          customReminderIntervalMinutes: taskToEdit.customReminderIntervalMinutes || 60,
          reminderStartTime: taskToEdit.reminderStartTime || "08:00",
          reminderEndTime: taskToEdit.reminderEndTime || "22:00",
          repeat: (taskToEdit.repeat as any) || rruleReverseMap[taskToEdit.recurrenceRule || ""] || "NONE",
          notes: taskToEdit.notes || "",
        });

        setInitialFiles(
          taskToEdit.attachments
            ? taskToEdit.attachments.map((att) => ({
                id: att.key,
                key: att.key,
                name: att.name,
                size: att.size,
                type: att.type,
                url: "",
                entityType: "todo",
                entityId: taskToEdit.id,
                createdAt: taskToEdit.createdAt,
              }))
            : []
        );
      } else {
        setStep(1);
        setSelectedTaskType("ONE_TIME");
        setDayOfWeek("Friday");
        setDayOfMonth(1);
        setIsFavorite(false);
        setChecklist([]);
        setTags([]);
        setLocalComments([]);
        reset({
          ...defaultFormValues,
          dueDate: "",
        });
        setInitialFiles([]);
      }
    }
  }, [taskToEdit, open, reset, setInitialFiles]);

  const handleSelectTaskType = (type: TaskType) => {
    setSelectedTaskType(type);
    setStep(2);

    if (type === "ONE_TIME") {
      setValue("repeat", "NONE");
      setValue("reminderType", "ONE_TIME");
      setValue("reminderSetting", "AT_DUE_TIME");
    } else if (type === "DAILY") {
      setValue("repeat", "DAILY");
      setValue("reminderType", "REPEATING");
      setValue("reminderInterval", "2_HOURS");
      if (!watch("startDate")) setValue("startDate", getTodayDateString());
    } else if (type === "WEEKLY") {
      setValue("repeat", "WEEKLY");
      setValue("reminderType", "ONE_TIME");
      setValue("reminderSetting", "1_HOUR");
      if (!watch("startDate")) setValue("startDate", getTodayDateString());
    } else if (type === "MONTHLY") {
      setValue("repeat", "MONTHLY");
      setValue("reminderType", "ONE_TIME");
      setValue("reminderSetting", "1_DAY");
      if (!watch("startDate")) setValue("startDate", getTodayDateString());
    } else if (type === "YEARLY") {
      setValue("repeat", "YEARLY");
      setValue("reminderType", "ONE_TIME");
      setValue("reminderSetting", "1_DAY");
      if (!watch("startDate")) setValue("startDate", getTodayDateString());
    }
  };

  const handleResetForm = () => {
    reset(defaultFormValues);
    setIsFavorite(false);
    setChecklist([]);
    setTags([]);
    setLocalComments([]);
  };

  const handleAddChecklistItem = () => {
    if (newChecklistText.trim()) {
      setChecklist((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text: newChecklistText.trim(), completed: false },
      ]);
      setNewChecklistText("");
    }
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const totalChecklistItems = checklist.length;
  const completedChecklistItems = checklist.filter((c) => c.completed).length;
  const checklistProgressPct =
    totalChecklistItems > 0
      ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
      : 0;

  // Form Submit Mutation
  const mutation = useMutation({
    mutationFn: async (data: TodoFormValues) => {
      const attachments =
        files.length > 0
          ? files.map((file) => ({
              key: file.key,
              name: file.name,
              type: file.type,
              size: file.size,
            }))
          : undefined;

      const rruleMap: Record<string, string | null> = {
        NONE: null,
        DAILY: "FREQ=DAILY",
        WEEKDAYS: "FREQ=WEEKDAYS",
        WEEKLY: "FREQ=WEEKLY",
        MONTHLY: "FREQ=MONTHLY",
        YEARLY: "FREQ=YEARLY",
      };

      const formatIsoStart = (dateStr?: string, timeStr?: string) => {
        let actualDate = dateStr;
        if ((!actualDate || !actualDate.trim()) && timeStr && timeStr.trim()) {
          actualDate = getTodayDateString();
        }
        if (!actualDate || !actualDate.trim()) return null;
        if (timeStr && timeStr.trim()) {
          const [y, m, d] = actualDate.split("-").map(Number);
          const [hr, min] = timeStr.split(":").map(Number);
          return new Date(y, m - 1, d, hr, min, 0).toISOString();
        }
        return `${actualDate}T00:00:00.000Z`;
      };

      const formatIsoDue = (dateStr?: string, timeStr?: string) => {
        let actualDate = dateStr;
        if ((!actualDate || !actualDate.trim()) && timeStr && timeStr.trim()) {
          actualDate = data.startDate ? data.startDate : getTodayDateString();
        }
        if (!actualDate || !actualDate.trim()) return null;
        if (timeStr && timeStr.trim()) {
          const [y, m, d] = actualDate.split("-").map(Number);
          const [hr, min] = timeStr.split(":").map(Number);
          return new Date(y, m - 1, d, hr, min, 0).toISOString();
        }
        return `${actualDate}T23:59:59.000Z`;
      };

      const categoryNames = ["Personal", "Work", "Health", "Finance", "Shopping", "Study", "Others", "Other"];
      const cleanTags = tags.filter((t: string) => !categoryNames.includes(t));
      const submitLabels = [data.category, ...cleanTags];

      let nextRemTime: string | null = null;
      if (data.reminderType === "ONE_TIME") {
        nextRemTime = calculateNextOneTimeReminder({
          startDate: formatIsoStart(data.startDate, data.startTime),
          dueDate: formatIsoDue(data.dueDate, data.dueTime),
          dueTime: data.dueTime,
          reminderSetting: data.reminderSetting,
        });
      } else if (data.reminderType === "REPEATING") {
        nextRemTime = calculateNextRepeatingReminder({
          reminderInterval: data.reminderInterval,
          customReminderIntervalMinutes: data.customReminderIntervalMinutes,
          reminderStartTime: data.reminderStartTime,
          reminderEndTime: data.reminderEndTime,
        });
      }

      let nextOccDate: string | null = null;
      if (data.repeat && data.repeat !== "NONE") {
        nextOccDate = calculateNextOccurrenceDate({
          repeat: data.repeat,
        }, data.dueDate ? new Date(data.dueDate) : new Date());
      }

      const submitData: any = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        category: data.category,
        priority: data.priority,
        status: data.status,
        startDate: formatIsoStart(data.startDate, data.startTime),
        dueDate: formatIsoDue(data.dueDate, data.dueTime),
        endDate: formatIsoDue(data.dueDate, data.dueTime),
        startTime: data.startTime || null,
        dueTime: data.dueTime || null,
        taskType: selectedTaskType,
        repeat: data.repeat,
        reminderType: data.reminderType,
        reminderSetting: data.reminderType === "ONE_TIME" ? data.reminderSetting : "NONE",
        reminderInterval: data.reminderInterval || null,
        customReminderIntervalMinutes: data.customReminderIntervalMinutes || null,
        reminderStartTime: data.reminderStartTime || null,
        reminderEndTime: data.reminderEndTime || null,
        dayOfWeek: selectedTaskType === "WEEKLY" ? dayOfWeek : null,
        dayOfMonth: selectedTaskType === "MONTHLY" ? dayOfMonth : null,
        nextReminderTime: nextRemTime,
        nextOccurrenceDate: nextOccDate,
        recurrenceRule: rruleMap[data.repeat] || null,
        checklist,
        labels: submitLabels,
        notes: data.notes?.trim() || null,
        isFavorite,
        attachments,
        projectId: initialProjectId || taskToEdit?.projectId || null,
        comments: isEditing ? (taskToEdit?.comments || localComments) : localComments,
      };

      if (isEditing && taskToEdit) {
        const updated = await todoRepository.updateTask(taskToEdit.id, submitData);
        scheduleTaskReminderNotification(updated);
        return updated;
      } else {
        const created = await todoRepository.createTask({
          ...submitData,
          userId: user?.id || "single_user",
        } as any);

        scheduleTaskReminderNotification(created);
        return created;
      }
    },
    onSuccess: (savedTask) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      logActivity({
        id: savedTask.id,
        title: savedTask.title,
        type: "task",
        status: isEditing ? "updated" : "created",
        subtitle: `${savedTask.priority} priority • ${savedTask.category}`,
        href: "/todos",
      });
      toast.success(isEditing ? "Task updated successfully!" : "Task created successfully!");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save task");
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
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  const onSubmit = (data: TodoFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[92vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>{isEditing ? "Edit Task" : "Task Creation Wizard"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {step === 1 && !isEditing
                ? "Step 1 of 2: Choose task type to open a tailored form."
                : `Step 2 of 2: ${selectedTaskType.replace("_", " ")} Configuration`}
            </DialogDescription>
          </div>

          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isFavorite
                ? "bg-amber-50 border-amber-200 text-amber-500 dark:bg-amber-950/40 dark:border-amber-800/80"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700"
            }`}
            title={isFavorite ? "Remove from Favorites" : "Mark as Favorite"}
          >
            <Star className={`w-5 h-5 ${isFavorite ? "fill-amber-400" : ""}`} />
          </button>
        </DialogHeader>

        {/* STEP 1: CHOOSE TASK TYPE SCREEN */}
        {step === 1 && !isEditing ? (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">What would you like to create?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose a task type to open a clean form with only the fields you need.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Card 1: One-Time Task */}
              <button
                type="button"
                onClick={() => handleSelectTaskType("ONE_TIME")}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">📝 One-Time Task</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      For tasks that happen only once (e.g. AWS Deployment, Buy Laptop).
                    </p>
                  </div>
                </div>
              </button>

              {/* Card 2: Daily Habit */}
              <button
                type="button"
                onClick={() => handleSelectTaskType("DAILY")}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Repeat className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">🔁 Daily Habit</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      For daily habits & interval reminders (e.g. Drink Water, Exercise).
                    </p>
                  </div>
                </div>
              </button>

              {/* Card 3: Weekly Task */}
              <button
                type="button"
                onClick={() => handleSelectTaskType("WEEKLY")}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">📅 Weekly Task</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      For weekly tasks on a chosen day (e.g. Weekly Team Report).
                    </p>
                  </div>
                </div>
              </button>

              {/* Card 4: Monthly Task */}
              <button
                type="button"
                onClick={() => handleSelectTaskType("MONTHLY")}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">🗓 Monthly Task</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      For tasks on a specific monthly date (e.g. Pay Electricity Bill).
                    </p>
                  </div>
                </div>
              </button>

              {/* Card 5: Yearly Reminder */}
              <button
                type="button"
                onClick={() => handleSelectTaskType("YEARLY")}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-md transition-all text-left group sm:col-span-2 cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">🎉 Yearly Reminder</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      For annual reminders every year (e.g. Birthdays, Anniversaries).
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (

        /* STEP 2: TAILORED TASK FORM */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          
          {!isEditing && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Task Types</span>
            </button>
          )}

          {/* SECTION 1: Basic Information */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="title" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </Label>
                <span className={`text-[11px] font-medium ${watchTitle.length > 100 ? "text-rose-500 font-bold" : "text-slate-400"}`}>
                  {watchTitle.length}/100
                </span>
              </div>
              <input
                id="title"
                type="text"
                maxLength={100}
                {...register("title")}
                placeholder="E.g. Complete quarterly financial review"
                className={`w-full h-11 px-3.5 rounded-xl border text-sm bg-slate-50/50 dark:bg-slate-800/50 transition-all outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.title ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                }`}
              />
              {errors.title && (
                <p className="text-xs text-rose-500 font-medium mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Description
              </Label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                placeholder="Add optional task details, context, or instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50/50 dark:bg-slate-800/50 transition-all outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* SECTION 2: Category, Priority, Status (Tailored by Task Type) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-purple-500" />
                <span>Category <span className="text-rose-500">*</span></span>
              </Label>
              <select
                id="category"
                {...register("category")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Health">Health</option>
                <option value="Finance">Finance</option>
                <option value="Shopping">Shopping</option>
                <option value="Study">Study</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                Priority <span className="text-rose-500">*</span>
              </Label>
              <select
                id="priority"
                {...register("priority")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Status (Only for ONE_TIME) */}
            {selectedTaskType === "ONE_TIME" && (
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  Status
                </Label>
                <select
                  id="status"
                  {...register("status")}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="PENDING">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            )}
          </div>

          {/* TAILORED SCHEDULE & REMINDER SECTION */}

          {/* 1. ONE_TIME Task Fields */}
          {selectedTaskType === "ONE_TIME" && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Schedule & One-Time Reminder</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dueDate" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Due Date
                  </Label>
                  <input
                    id="dueDate"
                    type="date"
                    {...register("dueDate")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dueTime" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Due Time
                  </Label>
                  <input
                    id="dueTime"
                    type="time"
                    {...register("dueTime")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminderSetting" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Reminder
                  </Label>
                  <select
                    id="reminderSetting"
                    {...register("reminderSetting")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="NONE">None</option>
                    <option value="AT_DUE_TIME">At Due Time</option>
                    <option value="5_MIN">5 Minutes Before</option>
                    <option value="15_MIN">15 Minutes Before</option>
                    <option value="30_MIN">30 Minutes Before</option>
                    <option value="1_HOUR">1 Hour Before</option>
                    <option value="1_DAY">1 Day Before</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. DAILY Habit Fields */}
          {selectedTaskType === "DAILY" && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-emerald-500" />
                <span>Daily Habit & Interval Reminder Schedule</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Start Date
                  </Label>
                  <input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminderStartTime" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Start Time
                  </Label>
                  <input
                    id="reminderStartTime"
                    type="time"
                    {...register("reminderStartTime")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminderEndTime" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    End Time
                  </Label>
                  <input
                    id="reminderEndTime"
                    type="time"
                    {...register("reminderEndTime")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminderInterval" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Reminder Interval
                  </Label>
                  <select
                    id="reminderInterval"
                    {...register("reminderInterval")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="30_MIN">Every 30 Minutes</option>
                    <option value="1_HOUR">Every 1 Hour</option>
                    <option value="2_HOURS">Every 2 Hours</option>
                    <option value="4_HOURS">Every 4 Hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 3. WEEKLY Task Fields */}
          {selectedTaskType === "WEEKLY" && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Weekly Task Schedule</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Day of Week
                  </Label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dueTime" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Time
                  </Label>
                  <input
                    id="dueTime"
                    type="time"
                    {...register("dueTime")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminderSetting" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Reminder
                  </Label>
                  <select
                    id="reminderSetting"
                    {...register("reminderSetting")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="NONE">None</option>
                    <option value="AT_DUE_TIME">At Due Time</option>
                    <option value="1_HOUR">1 Hour Before</option>
                    <option value="1_DAY">1 Day Before</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. MONTHLY Task Fields */}
          {selectedTaskType === "MONTHLY" && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Monthly Task Schedule</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Day of Month
                  </Label>
                  <select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of month
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dueTime" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Time
                  </Label>
                  <input
                    id="dueTime"
                    type="time"
                    {...register("dueTime")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminderSetting" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Reminder
                  </Label>
                  <select
                    id="reminderSetting"
                    {...register("reminderSetting")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="NONE">None</option>
                    <option value="AT_DUE_TIME">At Due Time</option>
                    <option value="1_DAY">1 Day Before</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. YEARLY Reminder Fields */}
          {selectedTaskType === "YEARLY" && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Yearly Reminder Schedule</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dueDate" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Date
                  </Label>
                  <input
                    id="dueDate"
                    type="date"
                    {...register("dueDate")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dueTime" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Time
                  </Label>
                  <input
                    id="dueTime"
                    type="time"
                    {...register("dueTime")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reminderSetting" className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Reminder
                  </Label>
                  <select
                    id="reminderSetting"
                    {...register("reminderSetting")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="NONE">None</option>
                    <option value="AT_DUE_TIME">At Due Time</option>
                    <option value="1_DAY">1 Day Before</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Subtask Checklist */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Subtask Checklist</span>
              </Label>
              {totalChecklistItems > 0 && (
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {completedChecklistItems}/{totalChecklistItems} ({checklistProgressPct}%)
                </span>
              )}
            </div>

            {totalChecklistItems > 0 && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${checklistProgressPct}%` }}
                />
              </div>
            )}

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs group"
                >
                  <label className="flex items-center gap-2 cursor-pointer min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklistItem(item.id)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span
                      className={`truncate ${
                        item.completed
                          ? "line-through text-slate-400"
                          : "text-slate-800 dark:text-slate-200 font-medium"
                      }`}
                    >
                      {item.text}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                    title="Delete subtask"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add subtask (e.g. Design UI)..."
                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 h-9 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Tags (For ONE_TIME tasks) */}
          {selectedTaskType === "ONE_TIME" && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-500" />
                <span>Tags</span>
              </Label>

              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 text-xs font-semibold flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag (e.g. AWS, React)..."
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 h-9 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              <span>Notes</span>
            </Label>
            <textarea
              id="notes"
              rows={2}
              {...register("notes")}
              placeholder='Optional extra notes (e.g. "Deploy to UAT environment before production.")'
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Attachments (For ONE_TIME tasks) */}
          {selectedTaskType === "ONE_TIME" && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                <span>Attachments (Images, PDF, Word, Excel, ZIP)</span>
              </Label>
              <FileUpload
                onFilesSelected={async (fileList) => {
                  try {
                    await uploadFiles(fileList);
                  } catch (err) {
                    toast.error("Failed to upload attachment");
                  }
                }}
                progress={progress}
                isUploading={isUploading}
                disabled={mutation.isPending}
              />
              <FileList
                files={files as any}
                onDownload={async (key) => {
                  try {
                    const url = await storageRepository.getFileUrl(key);
                    window.open(url, "_blank");
                  } catch (e) {
                    toast.error("Failed to fetch file");
                  }
                }}
                onDelete={async (key) => {
                  try {
                    await removeFile(key);
                    toast.success("File removed");
                  } catch (e) {
                    toast.error("Failed to remove file");
                  }
                }}
                disabled={mutation.isPending}
              />
            </div>
          )}

          {/* FOOTER BUTTONS: Cancel, Reset, Create Task */}
          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Clear all fields"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this task?")) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-3.5 py-2 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={mutation.isPending || isUploading || !isValid}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {mutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEditing ? "Save Changes" : "Create Task"}</span>
                  </>
                )}
              </button>
            </div>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
