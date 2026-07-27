"use client";

import { useState, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import rrulePlugin from "@fullcalendar/rrule";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoRepository } from "@/repositories";
import { Task } from "@/types";
import { TodoDialog } from "@/components/TodoDialog";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import toast from "react-hot-toast";
import { calculateNextOccurrenceDate } from "@/utils/reminderEngine";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  Edit2,
  Trash2,
  X,
  Tag as TagIcon,
  Paperclip,
  CheckSquare,
  Repeat,
  Bell
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export function isTaskScheduledForDate(task: Task, targetDateStr: string): boolean {
  if (!targetDateStr) return false;
  const cleanTargetStr = targetDateStr.slice(0, 10);
  const targetDate = new Date(cleanTargetStr);
  targetDate.setHours(0, 0, 0, 0);
  const targetTime = targetDate.getTime();

  const startStr = task.startDate ? task.startDate.slice(0, 10) : task.dueDate ? task.dueDate.slice(0, 10) : null;
  const dueStr = task.dueDate ? task.dueDate.slice(0, 10) : startStr;

  if (startStr === cleanTargetStr || dueStr === cleanTargetStr) return true;

  const repeat = task.repeat || (
    task.recurrenceRule === "FREQ=DAILY" ? "DAILY" :
    task.recurrenceRule === "FREQ=WEEKDAYS" ? "WEEKDAYS" :
    task.recurrenceRule === "FREQ=WEEKLY" ? "WEEKLY" :
    task.recurrenceRule === "FREQ=MONTHLY" ? "MONTHLY" :
    task.recurrenceRule === "FREQ=YEARLY" ? "YEARLY" : "NONE"
  );

  if (repeat === "NONE") return false;

  const startDate = startStr ? new Date(startStr) : new Date();
  startDate.setHours(0, 0, 0, 0);

  if (targetTime < startDate.getTime()) return false;

  if (task.endDate) {
    const endDate = new Date(task.endDate.slice(0, 10));
    endDate.setHours(23, 59, 59, 999);
    if (targetTime > endDate.getTime()) return false;
  }

  if (repeat === "DAILY") return true;

  if (repeat === "WEEKDAYS") {
    const day = targetDate.getDay();
    return day >= 1 && day <= 5;
  }

  if (repeat === "WEEKLY") {
    if (task.dayOfWeek) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const targetDayName = days[targetDate.getDay()];
      return targetDayName.toLowerCase() === String(task.dayOfWeek).toLowerCase();
    }
    return targetDate.getDay() === startDate.getDay();
  }

  if (repeat === "MONTHLY") {
    if (task.dayOfMonth) {
      return targetDate.getDate() === Number(task.dayOfMonth);
    }
    return targetDate.getDate() === startDate.getDate();
  }

  if (repeat === "YEARLY") {
    return targetDate.getMonth() === startDate.getMonth() && targetDate.getDate() === startDate.getDate();
  }

  return false;
}

function KpiCard({ title, value, icon: Icon, colorClass, onClick }: { title: string, value: number, icon: any, colorClass: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 overflow-hidden ${onClick ? 'cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md active:scale-98 transition-all' : ''}`}
    >
      <div className={`p-2.5 rounded-lg shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  
  // Category Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Personal",
    "Work",
    "Health",
    "Finance",
    "Shopping",
    "Study",
    "Others",
    "Other",
  ]);
  const [showDailyHabits, setShowDailyHabits] = useState<boolean>(true);
  
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const calendarRef = useRef<any>(null);

  // Date Schedule Modal State
  const [isDateScheduleModalOpen, setIsDateScheduleModalOpen] = useState(false);
  const [clickedDateStr, setClickedDateStr] = useState<string>("");

  // Drag & Drop Reschedule Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [pendingReschedule, setPendingReschedule] = useState<{
    task: Task;
    newStart: string;
    newEnd?: string;
    revertFn: () => void;
  } | null>(null);

  // Fetch Tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  // Update Task Mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      todoRepository.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully!");
    },
    onError: (err) => {
      toast.error("Failed to update task");
      console.error(err);
    },
  });

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => todoRepository.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: () => toast.error("Failed to delete task"),
  });

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "ALL" && task.status !== statusFilter) {
        return false;
      }

      // 3. Priority Filter
      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) {
        return false;
      }

      // 4. Category Filter
      const category = task.category || "Personal";
      const matchesCategory = selectedCategories.includes(category);
      if (!matchesCategory) return false;

      // 5. Daily Habits Toggle Filter
      const isDailyHabit = (task.repeat === "DAILY" || task.repeat === "WEEKDAYS") ||
        (task.recurrenceRule && (task.recurrenceRule === "FREQ=DAILY" || task.recurrenceRule === "FREQ=WEEKDAYS"));
      if (!showDailyHabits && isDailyHabit) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, selectedCategories, showDailyHabits]);

  // KPI Stats
  const kpiStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const nowTime = now.getTime();

    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    tasks.forEach(t => {
      if (t.status === "COMPLETED") {
        completedCount++;
      } else {
        const startStr = t.startDate ? t.startDate.slice(0, 10) : t.dueDate ? t.dueDate.slice(0, 10) : "";
        const due = t.dueDate ? new Date(t.dueDate).getTime() : null;

        if (startStr === todayStr) todayCount++;
        if (due && due > nowTime) upcomingCount++;
        if (due && due < nowTime) overdueCount++;
      }
    });

    return { today: todayCount, upcoming: upcomingCount, overdue: overdueCount, completed: completedCount };
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const now = new Date().getTime();
    return tasks
      .filter(t => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate).getTime() > now)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [tasks]);

  // Events Map for FullCalendar
  const events = useMemo(() => {
    const now = new Date().getTime();

    return filteredTasks.map((task) => {
      let backgroundColor = "#3b82f6";
      const isRecurring = (task.repeat && task.repeat !== "NONE") || (task.recurrenceRule && task.recurrenceRule !== "NONE");
      if (!isRecurring && task.status === "COMPLETED") {
        backgroundColor = "#10b981";
      } else if (task.status === "IN_PROGRESS") {
        backgroundColor = "#8b5cf6";
      }

      let borderColor = backgroundColor;
      const due = task.dueDate ? new Date(task.dueDate).getTime() : null;
      const isOverdue = due ? (due < now && task.status !== "COMPLETED") : false;

      if (isOverdue) {
        borderColor = "#ef4444";
      }

      const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate as string || new Date());
      const hasExplicitTime = !!(task.startTime || task.dueTime);

      const baseEvent: any = {
        id: task.id,
        title: task.title,
        backgroundColor,
        borderColor,
        allDay: !hasExplicitTime,
        extendedProps: {
          task,
          isOverdue,
        },
      };

      let rruleCode = task.recurrenceRule;
      const repeatType = task.repeat || (
        task.recurrenceRule?.includes("FREQ=DAILY") ? "DAILY" :
        task.recurrenceRule?.includes("FREQ=WEEKDAYS") ? "WEEKDAYS" :
        task.recurrenceRule?.includes("FREQ=WEEKLY") ? "WEEKLY" :
        task.recurrenceRule?.includes("FREQ=MONTHLY") ? "MONTHLY" :
        task.recurrenceRule?.includes("FREQ=YEARLY") ? "YEARLY" : "NONE"
      );

      if (repeatType === "DAILY") {
        rruleCode = "FREQ=DAILY";
      } else if (repeatType === "WEEKDAYS") {
        rruleCode = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
      } else if (repeatType === "WEEKLY") {
        if (task.dayOfWeek) {
          const dayMap: Record<string, string> = {
            SUNDAY: "SU", MONDAY: "MO", TUESDAY: "TU", WEDNESDAY: "WE",
            THURSDAY: "TH", FRIDAY: "FR", SATURDAY: "SA"
          };
          const byDay = dayMap[String(task.dayOfWeek).toUpperCase()] || "FR";
          rruleCode = `FREQ=WEEKLY;BYDAY=${byDay}`;
        } else {
          rruleCode = "FREQ=WEEKLY";
        }
      } else if (repeatType === "MONTHLY") {
        const dom = task.dayOfMonth ? Number(task.dayOfMonth) : (start ? start.getDate() : 1);
        rruleCode = `FREQ=MONTHLY;BYMONTHDAY=${dom}`;
      } else if (repeatType === "YEARLY") {
        rruleCode = "FREQ=YEARLY";
      }

      const eventTargetDate = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : new Date());
      const end = task.endDate ? new Date(task.endDate) : new Date(eventTargetDate.getTime() + 60 * 60 * 1000);

      if (rruleCode && rruleCode !== "NONE") {
        const dateOnlyStr = task.dueDate ? task.dueDate.slice(0, 10).replace(/-/g, "") : (task.startDate ? task.startDate.slice(0, 10).replace(/-/g, "") : "");
        if (!hasExplicitTime && dateOnlyStr) {
          baseEvent.rrule = `DTSTART:${dateOnlyStr}\nRRULE:${rruleCode}`;
        } else {
          baseEvent.rrule = `DTSTART:${eventTargetDate.toISOString().replace(/[-:]/g, "").split('.')[0]}Z\nRRULE:${rruleCode}`;
        }
      } else {
        if (!hasExplicitTime) {
          baseEvent.start = task.dueDate ? task.dueDate.slice(0, 10) : (task.startDate ? task.startDate.slice(0, 10) : eventTargetDate.toISOString().slice(0, 10));
        } else {
          baseEvent.start = eventTargetDate.toISOString();
          baseEvent.end = end.toISOString();
        }
      }

      return baseEvent;
    });
  }, [filteredTasks]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleMiniCalendarSelect = (date: Date) => {
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(date);
    }
  };

  const handleEventDrop = (info: any) => {
    const task = info.event.extendedProps.task as Task;
    const isRecurring = (task.repeat && task.repeat !== "NONE") || (task.recurrenceRule && task.recurrenceRule !== "NONE");

    const newStart = info.event.start.toISOString();
    const newEnd = info.event.end ? info.event.end.toISOString() : undefined;

    if (isRecurring) {
      setPendingReschedule({
        task,
        newStart,
        newEnd,
        revertFn: () => info.revert(),
      });
      setIsRescheduleModalOpen(true);
    } else {
      if (!window.confirm("Are you sure you want to reschedule this task?")) {
        info.revert();
        return;
      }
      updateTaskMutation.mutate({ 
        id: task.id, 
        updates: { 
          startDate: newStart, 
          dueDate: newStart,
          ...(newEnd && { endDate: newEnd })
        } 
      });
    }
  };

  const handleEventResize = (info: any) => {
    handleEventDrop(info);
  };

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task as Task;
    setSelectedTask(task);
    setSelectedDateStr(null);
    setIsDialogOpen(true);
  };

  const handleDateClick = (info: any) => {
    setClickedDateStr(info.dateStr);
    setIsDateScheduleModalOpen(true);
  };

  const renderEventContent = (eventInfo: any) => {
    const task = eventInfo.event.extendedProps?.task;
    const isRecurring = (task?.repeat && task.repeat !== "NONE") || (task?.recurrenceRule && task.recurrenceRule !== "NONE");
    const now = new Date().getTime();

    const targetEnd = task?.endDate 
      ? new Date(task.endDate).getTime() 
      : task?.dueDate 
      ? new Date(task.dueDate).getTime() 
      : 0;

    const eventDate = eventInfo.event.start ? new Date(eventInfo.event.start).getTime() : 0;
    const endOfToday = new Date().setHours(23, 59, 59, 999);
    const isTimePassed = targetEnd ? targetEnd < now : false;

    let bg = "#3b82f6";
    if (isRecurring) {
      const taskDueMs = task?.dueDate ? new Date(task.dueDate).getTime() : (task?.startDate ? new Date(task.startDate).getTime() : 0);
      const isSpecificInstance = taskDueMs ? Math.abs(eventDate - taskDueMs) < 24 * 60 * 60 * 1000 : false;

      if (task?.status === "COMPLETED" && isSpecificInstance) {
        bg = "#10b981";
      } else if (task?.status === "IN_PROGRESS" && isSpecificInstance) {
        bg = "#8b5cf6";
      } else {
        bg = "#3b82f6";
      }
    } else {
      if (task?.status === "COMPLETED") {
        bg = "#10b981";
      } else if (task?.status === "IN_PROGRESS") {
        bg = "#8b5cf6";
      }
    }

    const isOverdue = task?.status !== "COMPLETED" && (
      isRecurring 
        ? (isTimePassed && eventDate <= endOfToday) 
        : (eventInfo.event.extendedProps?.isOverdue || isTimePassed)
    );

    return (
      <div 
        style={{ backgroundColor: bg }}
        className={`flex items-center justify-between w-full h-full px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs relative ${isOverdue ? 'ring-2 ring-red-500' : ''}`}
      >
        <span className="truncate">{eventInfo.event.title}</span>
        {isOverdue && <span title="Overdue"><AlertTriangle className="w-3.5 h-3.5 text-white shrink-0 ml-1" /></span>}
      </div>
    );
  };

  const tasksOnClickedDate = useMemo(() => {
    if (!clickedDateStr) return [];
    return tasks.filter((t) => isTaskScheduledForDate(t, clickedDateStr));
  }, [tasks, clickedDateStr]);

  const handleToggleCompleteOnDate = (task: Task) => {
    const isRecurring = (task.repeat && task.repeat !== "NONE") || (task.recurrenceRule && task.recurrenceRule !== "NONE");
    if (isRecurring) {
      const nextOcc = calculateNextOccurrenceDate(task, task.dueDate ? new Date(task.dueDate) : new Date());
      updateTaskMutation.mutate({
        id: task.id,
        updates: {
          status: "PENDING",
          dueDate: nextOcc,
          endDate: nextOcc,
          startDate: nextOcc,
          nextOccurrenceDate: calculateNextOccurrenceDate(task, new Date(nextOcc)),
        },
      });
      toast.success("Recurring occurrence marked complete! Scheduled for next date.");
    } else {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      updateTaskMutation.mutate({
        id: task.id,
        updates: { status: newStatus },
      });
    }
  };

  const handleRescheduleChoice = (choice: "SINGLE" | "FUTURE" | "ALL") => {
    if (!pendingReschedule) return;
    const { task, newStart, newEnd } = pendingReschedule;

    if (choice === "SINGLE") {
      updateTaskMutation.mutate({
        id: task.id,
        updates: {
          dueDate: newStart,
          endDate: newEnd || newStart,
        },
      });
      toast.success("Rescheduled single occurrence!");
    } else if (choice === "FUTURE" || choice === "ALL") {
      updateTaskMutation.mutate({
        id: task.id,
        updates: {
          startDate: newStart,
          dueDate: newStart,
          endDate: newEnd || newStart,
        },
      });
      toast.success(choice === "FUTURE" ? "Rescheduled future occurrences!" : "Rescheduled all occurrences!");
    }

    setIsRescheduleModalOpen(false);
    setPendingReschedule(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const allCategories = ["Personal", "Work", "Health", "Finance", "Shopping", "Study", "Others", "Other"];

  const handleJumpToToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row gap-6 items-start pb-6">
      {/* Left Sidebar */}
      <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-5 bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            Calendar
          </h1>
        </div>
        
        <button 
          onClick={() => {
            setSelectedTask(null);
            setSelectedDateStr(new Date().toISOString().slice(0, 10));
            setIsDialogOpen(true);
          }}
          className="flex items-center justify-center w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Event
        </button>

        <MiniCalendar 
          selectedDate={new Date()} 
          onSelectDate={handleMiniCalendarSelect} 
        />

        <div className="pt-2">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">My Calendars</h3>
          <div className="space-y-3">
            {allCategories.map(cat => (
              <label key={cat} className="flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition">
                  {cat}
                </span>
              </label>
            ))}

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowDailyHabits(!showDailyHabits)}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs ${
                  showDailyHabits
                    ? "bg-purple-600 text-white hover:bg-purple-700 active:scale-98 shadow-purple-200 dark:shadow-none"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {showDailyHabits ? (
                    <Eye className="w-4 h-4 text-white" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Daily Habits</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  showDailyHabits
                    ? "bg-purple-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}>
                  {showDailyHabits ? "SHOWING" : "HIDDEN"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 pt-2">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider">Upcoming Timeline</h3>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming tasks.</p>
          ) : (
            <div className="space-y-4">
              {upcomingTasks.map(t => (
                <div key={t.id} className="flex gap-3 relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-gray-100 dark:before:bg-gray-700 last:before:hidden">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.dueDate && new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative w-full xl:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="pl-9 h-9 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-50/50 dark:bg-gray-900/50 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
              <Filter className="h-3.5 w-3.5 text-gray-400 ml-2.5" />
              <select 
                className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 py-1.5 pl-2 pr-7 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            
            <select 
              className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 2xl:grid-cols-4 gap-3">
          <KpiCard title="Today" value={kpiStats.today} icon={CalendarIcon} colorClass="bg-blue-500" onClick={handleJumpToToday} />
          <KpiCard title="Upcoming" value={kpiStats.upcoming} icon={Clock} colorClass="bg-purple-500" onClick={() => setStatusFilter("PENDING")} />
          <KpiCard title="Overdue" value={kpiStats.overdue} icon={AlertTriangle} colorClass="bg-red-500" onClick={() => setStatusFilter("ALL")} />
          <KpiCard title="Completed" value={kpiStats.completed} icon={CheckCircle} colorClass="bg-green-500" onClick={() => setStatusFilter("COMPLETED")} />
        </div>

        {/* FullCalendar Grid */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 calendar-container z-0 relative">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,listWeek",
            }}
            showNonCurrentDates={false}
            fixedWeekCount={false}
            events={events}
            dayMaxEvents={2}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventContent={renderEventContent}
            height="650px"
            timeZone="local"
            eventClassNames="cursor-pointer transition-opacity hover:opacity-90 rounded-sm"
          />
        </div>
      </div>

      {/* Date Schedule Modal (Triggered when clicking any calendar date) */}
      <Dialog open={isDateScheduleModalOpen} onOpenChange={setIsDateScheduleModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Schedule for {clickedDateStr ? new Date(clickedDateStr).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ""}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {tasksOnClickedDate.length} {tasksOnClickedDate.length === 1 ? "task" : "tasks"} scheduled for this date.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {tasksOnClickedDate.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No tasks scheduled for this date.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsDateScheduleModalOpen(false);
                    setSelectedTask(null);
                    setSelectedDateStr(clickedDateStr);
                    setIsDialogOpen(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition cursor-pointer"
                >
                  + Add Task for this Date
                </button>
              </div>
            ) : (
              tasksOnClickedDate.map((t) => {
                const totalChecklist = t.checklist ? t.checklist.length : 0;
                const completedChecklist = t.checklist ? t.checklist.filter(c => c.completed).length : 0;

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleteOnDate(t)}
                          className="mt-0.5 cursor-pointer text-slate-400 hover:text-emerald-500 transition"
                          title="Toggle Completion"
                        >
                          <CheckCircle className={`w-5 h-5 ${t.status === "COMPLETED" ? "text-emerald-500 fill-emerald-100" : ""}`} />
                        </button>
                        <div>
                          <h4 className={`text-sm font-bold text-slate-900 dark:text-white ${t.status === "COMPLETED" ? "line-through text-slate-400" : ""}`}>
                            {t.title}
                          </h4>
                          {t.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDateScheduleModalOpen(false);
                            setSelectedTask(t);
                            setIsDialogOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTaskMutation.mutate(t.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                        {t.category || "Personal"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                        t.priority === "HIGH" ? "bg-rose-100 text-rose-700" : t.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {t.priority} Priority
                      </span>
                      {t.dueTime && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.dueTime}
                        </span>
                      )}
                      {(t.repeat && t.repeat !== "NONE") && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          {t.repeat}
                        </span>
                      )}
                      {totalChecklist > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 font-semibold flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          {completedChecklist}/{totalChecklist} Subtasks
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <button
              type="button"
              onClick={() => {
                setIsDateScheduleModalOpen(false);
                setSelectedTask(null);
                setSelectedDateStr(clickedDateStr);
                setIsDialogOpen(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition cursor-pointer"
            >
              + Create Task for this Date
            </button>
            <button
              type="button"
              onClick={() => setIsDateScheduleModalOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drag & Drop Reschedule Prompt Modal */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={(open) => {
        if (!open && pendingReschedule) pendingReschedule.revertFn();
        setIsRescheduleModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Reschedule Recurring Task</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are moving a recurring task. Which occurrences would you like to update?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <button
              type="button"
              onClick={() => handleRescheduleChoice("SINGLE")}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition cursor-pointer"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">🎯 This occurrence only</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Reschedules only this single date instance.</p>
            </button>

            <button
              type="button"
              onClick={() => handleRescheduleChoice("FUTURE")}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition cursor-pointer"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">⏩ This and future occurrences</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Reschedules from this date forward.</p>
            </button>

            <button
              type="button"
              onClick={() => handleRescheduleChoice("ALL")}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition cursor-pointer"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">🔁 All occurrences</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Updates the master task schedule.</p>
            </button>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                if (pendingReschedule) pendingReschedule.revertFn();
                setIsRescheduleModalOpen(false);
              }}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Creation & Edit Modal */}
      <TodoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        taskToEdit={selectedTask}
        initialDate={selectedDateStr}
      />
    </div>
  );
}
