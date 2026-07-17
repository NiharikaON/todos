"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import rrulePlugin from "@fullcalendar/rrule";
import { todoRepository } from "@/repositories";
import { Task } from "@/types";
import { TodoDialog } from "@/components/TodoDialog";
import toast from "react-hot-toast";
import { Search, Filter, AlertTriangle, Plus, Calendar as CalendarIcon, Download, LayoutGrid, CheckCircle, Clock, MoreHorizontal } from "lucide-react";
import { exportTasksToCSV, exportTasksToICS } from "@/utils/exportCalendar";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { WeeklyProductivityChart } from "@/components/calendar/WeeklyProductivityChart";

function KpiCard({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 overflow-hidden">
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
  
  // New filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Personal", "Work", "Other", "Shopping", "Health", "Finance"]);
  
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [jumpDate, setJumpDate] = useState("");
  const calendarRef = useRef<any>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      todoRepository.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.labels?.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
      
      const category = task.category || "Personal";
      const matchesCategory = selectedCategories.includes(category);

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && (task.dueDate || task.startDate);
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, selectedCategories]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    tasks.forEach(task => {
      if (task.status === "COMPLETED") {
        completedCount++;
        return;
      }
      
      const due = task.dueDate ? new Date(task.dueDate).getTime() : null;
      if (!due) return;

      if (due < startOfToday) {
        overdueCount++;
      } else if (due >= startOfToday && due <= endOfToday) {
        todayCount++;
      } else if (due > endOfToday) {
        upcomingCount++;
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

  const events = useMemo(() => {
    const now = new Date().getTime();

    return filteredTasks.map((task) => {
      let backgroundColor = "#8b5cf6"; // Purple (Todo/PENDING)
      let borderColor = backgroundColor;

      if (task.status === "COMPLETED") {
        backgroundColor = "#9ca3af"; // Gray
      } else if (task.status === "IN_PROGRESS") {
        backgroundColor = "#3b82f6"; // Blue
      } else {
        if (task.priority === "HIGH") backgroundColor = "#ef4444"; // Red
        else if (task.priority === "MEDIUM") backgroundColor = "#f97316"; // Orange
        else if (task.priority === "LOW") backgroundColor = "#22c55e"; // Green
      }

      borderColor = backgroundColor;

      const due = task.dueDate ? new Date(task.dueDate).getTime() : null;
      const isOverdue = due && due < now && task.status !== "COMPLETED";

      if (isOverdue) {
        borderColor = "#dc2626"; // Strong red border for overdue
      }

      const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate as string);
      const end = task.endDate ? new Date(task.endDate) : new Date(start.getTime() + 60 * 60 * 1000);

      const baseEvent: any = {
        id: task.id,
        title: task.title,
        backgroundColor,
        borderColor,
        extendedProps: {
          task,
          isOverdue,
        },
      };

      if (task.recurrenceRule && task.recurrenceRule !== "NONE") {
        baseEvent.rrule = `DTSTART:${start.toISOString().replace(/[-:]/g, "").split('.')[0]}Z\nRRULE:${task.recurrenceRule}`;
      } else {
        baseEvent.start = start.toISOString();
        baseEvent.end = end.toISOString();
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
    if (!window.confirm("Are you sure you want to reschedule this task?")) {
      info.revert();
      return;
    }
    const task = info.event.extendedProps.task as Task;
    const newStart = info.event.start.toISOString();
    const newEnd = info.event.end ? info.event.end.toISOString() : undefined;
    updateTaskMutation.mutate({ 
      id: task.id, 
      updates: { 
        startDate: newStart, 
        dueDate: newStart,
        ...(newEnd && { endDate: newEnd })
      } 
    });
  };

  const handleEventResize = (info: any) => {
    if (!window.confirm("Are you sure you want to resize this task?")) {
      info.revert();
      return;
    }
    const task = info.event.extendedProps.task as Task;
    const newStart = info.event.start.toISOString();
    const newEnd = info.event.end ? info.event.end.toISOString() : undefined;
    updateTaskMutation.mutate({ 
      id: task.id, 
      updates: { 
        startDate: newStart,
        ...(newEnd && { endDate: newEnd })
      } 
    });
  };

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task as Task;
    setSelectedTask(task);
    setSelectedDateStr(null);
    setIsDialogOpen(true);
  };

  const handleDateClick = (info: any) => {
    setSelectedTask(null);
    setSelectedDateStr(info.dateStr);
    setIsDialogOpen(true);
  };

  const renderEventContent = (eventInfo: any) => {
    const isOverdue = eventInfo.event.extendedProps.isOverdue;
    return (
      <div className={`flex flex-col w-full h-full p-0.5 overflow-hidden text-[11px] text-white ${isOverdue ? 'border-l-4 border-red-600' : ''}`}>
        <div className="font-semibold flex items-center justify-between w-full truncate">
          <span className="truncate">{eventInfo.event.title}</span>
          {isOverdue && <AlertTriangle className="w-3 h-3 text-red-100 flex-shrink-0 ml-1" />}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const allCategories = ["Personal", "Work", "Other", "Shopping", "Health", "Finance"];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-4rem)]">
      {/* Left Sidebar */}
      <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center">
            <CalendarIcon className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Calendar
          </h1>
        </div>
        
        <button 
          onClick={() => {
            setSelectedTask(null);
            setSelectedDateStr(new Date().toISOString());
            setIsDialogOpen(true);
          }}
          className="flex items-center justify-center w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium shadow-sm shadow-indigo-200 dark:shadow-none"
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
                  className="rounded text-indigo-600 focus:ring-indigo-500 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition">
                  {cat}
                </span>
              </label>
            ))}
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
        
        {/* Top Action Bar */}
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
          <KpiCard title="Today" value={kpiStats.today} icon={CalendarIcon} colorClass="bg-blue-500" />
          <KpiCard title="Upcoming" value={kpiStats.upcoming} icon={Clock} colorClass="bg-purple-500" />
          <KpiCard title="Overdue" value={kpiStats.overdue} icon={AlertTriangle} colorClass="bg-red-500" />
          <KpiCard title="Completed" value={kpiStats.completed} icon={CheckCircle} colorClass="bg-green-500" />
        </div>

        {/* FullCalendar */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 calendar-container z-0 relative">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={events}
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
        
        {/* Weekly Productivity Charts */}
        <WeeklyProductivityChart tasks={tasks} />
      </div>

      <TodoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        taskToEdit={selectedTask}
        initialDate={selectedDateStr}
      />
    </div>
  );
}
