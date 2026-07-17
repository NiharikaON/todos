"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoRepository } from "@/repositories";
import { useState } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { TodoDialog } from "@/components/TodoDialog";
import { AttachmentLink } from "@/components/AttachmentLink";
import { Task } from "@/types";

export default function TodosPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

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
    setTaskToEdit(task);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setTaskToEdit(null);
    setIsDialogOpen(true);
  };

  const toggleTaskStatus = (task: Task) => {
    toggleMutation.mutate({ id: task.id, status: task.status });
  };

  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          (task.description?.toLowerCase().includes(search.toLowerCase()));
    const matchesPriority = filterPriority === "ALL" || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

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
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Todos</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your daily tasks and priorities.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Todo
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              placeholder="Search todos..."
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative inline-flex items-center">
              <Filter className="w-5 h-5 text-gray-400 mr-2" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {filteredTasks.map((task: Task) => (
            <li key={task.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 gap-4">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className="flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${task.status === "COMPLETED" ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className={`mt-1 text-sm truncate ${task.status === "COMPLETED" ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {task.description}
                      </p>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {task.attachments.map(att => (
                          <AttachmentLink key={att.key} attachment={att} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${task.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                    ${task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                    ${task.priority === 'LOW' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                  `}>
                    {task.priority}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 sm:opacity-100">
                    <button onClick={() => handleEdit(task)} className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {filteredTasks.length === 0 && (
            <li className="p-12 text-center text-gray-500 dark:text-gray-400">
              No tasks found matching your criteria.
            </li>
          )}
        </ul>
      </div>

      <TodoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
