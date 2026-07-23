"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoRepository } from "@/repositories";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Filter, ChevronLeft, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import { TodoDialog } from "@/components/TodoDialog";
import { AttachmentLink } from "@/components/AttachmentLink";
import { Task } from "@/types";
import { useSearch } from "@/providers/SearchProvider";
import { useActivity } from "@/providers/ActivityProvider";

function TodosContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { searchQuery, setSearchQuery } = useSearch();
  const { logActivity } = useActivity();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl) {
      setFilterStatus(statusFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPriority, filterStatus]);

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  const toggleMutation = useMutation({
    mutationFn: (task: { id: string, status: string }) => {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      return todoRepository.updateTask(task.id, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to update task status");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => todoRepository.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: () => {
      toast.error("Failed to delete task");
    }
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (task: Task) => {
    logActivity({
      id: task.id,
      title: task.title,
      type: "task",
      status: task.status,
      subtitle: `${task.priority} priority`,
      href: "/todos",
    });
    setTaskToEdit(task);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setTaskToEdit(null);
    setIsDialogOpen(true);
  };

  const toggleTaskStatus = (task: Task) => {
    logActivity({
      id: task.id,
      title: task.title,
      type: "task",
      status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED",
      subtitle: `${task.priority} priority`,
      href: "/todos",
    });
    toggleMutation.mutate({ id: task.id, status: task.status });
  };

  const handleStatusChange = (val: string) => {
    setFilterStatus(val);
    if (val === "ALL") {
      setFilterPriority("ALL");
    }
  };

  const handleResetFilters = () => {
    setFilterStatus("ALL");
    setFilterPriority("ALL");
    setSearchQuery("");
  };

  const isFiltered = filterStatus !== "ALL" || filterPriority !== "ALL" || searchQuery.trim() !== "";

  const filteredTasks = tasks.filter((task: Task) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
                          task.title.toLowerCase().includes(query) || 
                          (task.description?.toLowerCase().includes(query)) ||
                          task.priority.toLowerCase().includes(query) ||
                          task.status.toLowerCase().includes(query) ||
                          (query === "completed" && task.status === "COMPLETED") ||
                          (query === "pending" && task.status === "PENDING") ||
                          (query === "in progress" && task.status === "IN_PROGRESS") ||
                          (query === "in_progress" && task.status === "IN_PROGRESS") ||
                          (query === "high" && task.priority === "HIGH") ||
                          (query === "medium" && task.priority === "MEDIUM") ||
                          (query === "low" && task.priority === "LOW");

    const matchesPriority = filterPriority === "ALL" || task.priority.toUpperCase() === filterPriority.toUpperCase();

    let matchesStatus = true;
    if (filterStatus === "COMPLETED") {
      matchesStatus = task.status.toUpperCase() === "COMPLETED";
    } else if (filterStatus === "IN_PROGRESS") {
      matchesStatus = task.status.toUpperCase() === "IN_PROGRESS";
    } else if (filterStatus === "PENDING") {
      matchesStatus = task.status.toUpperCase() === "PENDING" || (task.status.toUpperCase() !== "COMPLETED" && task.status.toUpperCase() !== "IN_PROGRESS");
    }

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const startIndex = filteredTasks.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE : 0;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredTasks.length);
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Pagination Buttons Generator (handles 17+ pages cleanly)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Failed to load tasks.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Todos</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your daily tasks and priorities.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl shadow-md text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Todo
        </button>
      </div>

      {/* Rectangular Card Container */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Filter Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md w-full flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
              placeholder="Search todos by name, priority, status..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="relative inline-flex items-center">
              <select
                value={filterStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-200 appearance-none font-medium cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending Tasks</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed Tasks</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative inline-flex items-center">
              <Filter className="w-4 h-4 text-slate-400 mr-2" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-200 appearance-none font-medium cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task Item List */}
        <ul className="divide-y divide-gray-100 dark:divide-slate-800 min-h-[300px]">
          {paginatedTasks.map((task: Task) => (
            <li key={task.id} className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 gap-4">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className="flex-shrink-0 text-slate-300 dark:text-slate-600 hover:text-blue-500 hover:scale-110 transition-all duration-200"
                  >
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 drop-shadow-sm" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                  <div 
                    onClick={() => handleEdit(task)}
                    className="min-w-0 flex-1 cursor-pointer group/title"
                  >
                    <p className={`text-sm font-semibold truncate transition-colors ${task.status === "COMPLETED" ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white group-hover/title:text-purple-600'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className={`mt-1 text-xs truncate ${task.status === "COMPLETED" ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {task.description}
                      </p>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        {task.attachments.map(att => (
                          <AttachmentLink key={att.key} attachment={att} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                    ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400' : ''}
                    ${task.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/30 dark:text-orange-400' : ''}
                    ${task.priority === 'LOW' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400' : ''}
                  `}>
                    {task.priority}
                  </span>
                  <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => handleEdit(task)} title="View & Edit Task Details" className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-lg hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/50 dark:hover:text-purple-400 transition-colors cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {filteredTasks.length === 0 && (
            <li className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium">
              {searchQuery.trim() ? `No tasks found matching "${searchQuery.trim()}".` : "No tasks found matching your criteria."}
            </li>
          )}
        </ul>

        {/* Pagination Footer - Matches reference image */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-bold text-slate-800 dark:text-white">{filteredTasks.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-bold text-slate-800 dark:text-white">{endIndex}</span> of <span className="font-bold text-slate-800 dark:text-white">{filteredTasks.length}</span> tasks
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Previous Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Number Buttons */}
            {getPageNumbers().map((page, idx) => (
              typeof page === "number" ? (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                    currentPage === page
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} className="px-1 text-slate-400 select-none">
                  ...
                </span>
              )
            ))}

            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <TodoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}

export default function TodosPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <TodosContent />
    </Suspense>
  );
}
