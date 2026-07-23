"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoRepository } from "@/repositories";
import { Task, ChecklistItem } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { TodoDialog } from "@/components/TodoDialog";
import toast from "react-hot-toast";
import { 
  ListChecks, 
  Plus, 
  Search, 
  CheckSquare, 
  Square, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  Tag, 
  AlertTriangle 
} from "lucide-react";

export default function ChecklistPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Local state for adding new checklist item per task
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  
  // Local state for editing an existing checklist item [taskId-itemId]: string
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => todoRepository.getTasks(),
    enabled: !!user?.id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      todoRepository.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to update checklist");
    },
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      return searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.checklist?.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [tasks, searchQuery]);

  // Handler to toggle a checklist item
  const handleToggleItem = (task: Task, itemId: string) => {
    const currentList = task.checklist || [];
    const updatedList = currentList.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    // Auto update main task status if all completed
    const allDone = updatedList.length > 0 && updatedList.every(i => i.completed);
    const newStatus = allDone ? "COMPLETED" : (updatedList.some(i => i.completed) ? "IN_PROGRESS" : task.status);

    updateTaskMutation.mutate({
      id: task.id,
      updates: { checklist: updatedList, status: newStatus },
    });
  };

  // Handler to add a new item to a task checklist
  const handleAddItem = (task: Task) => {
    const text = newItemTexts[task.id]?.trim();
    if (!text) return;

    const currentList = task.checklist || [];
    const newItem: ChecklistItem = {
      id: "item-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      text,
      completed: false,
    };

    const updatedList = [...currentList, newItem];
    updateTaskMutation.mutate({
      id: task.id,
      updates: { checklist: updatedList },
    });

    setNewItemTexts(prev => ({ ...prev, [task.id]: "" }));
    toast.success("Checklist item added");
  };

  // Handler to delete a checklist item
  const handleDeleteItem = (task: Task, itemId: string) => {
    const currentList = task.checklist || [];
    const updatedList = currentList.filter(item => item.id !== itemId);

    updateTaskMutation.mutate({
      id: task.id,
      updates: { checklist: updatedList },
    });
    toast.success("Checklist item removed");
  };

  // Handler to start editing a checklist item
  const handleStartEditItem = (itemId: string, text: string) => {
    setEditingItemId(itemId);
    setEditingItemText(text);
  };

  // Handler to save an edited checklist item
  const handleSaveEditItem = (task: Task, itemId: string) => {
    if (!editingItemText.trim()) return;

    const currentList = task.checklist || [];
    const updatedList = currentList.map(item =>
      item.id === itemId ? { ...item, text: editingItemText.trim() } : item
    );

    updateTaskMutation.mutate({
      id: task.id,
      updates: { checklist: updatedList },
    });

    setEditingItemId(null);
    setEditingItemText("");
    toast.success("Checklist item updated");
  };

  return (
    <div className="flex-1 space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <ListChecks className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />
            Task Checklists
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Break down tasks into actionable checklist items with real-time completion progress bars.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedTaskToEdit(null);
            setIsDialogOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          Create Checklist Task
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search checklists or items..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Checklist Cards List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs text-center p-6">
          <ListChecks className="w-12 h-12 text-indigo-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No checklists found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {searchQuery
              ? "Try adjusting your search query"
              : "Click '+ Create Checklist Task' to start adding checklist items to your tasks!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTasks.map((task) => {
            const checklist = task.checklist || [];
            const totalCount = checklist.length;
            const completedCount = checklist.filter(i => i.completed).length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (task.status === "COMPLETED" ? 100 : 0);

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Task Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedTaskToEdit(task);
                        setIsDialogOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors shrink-0"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Section */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span>Progress</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {totalCount > 0 ? `${completedCount} of ${totalCount} Completed (${progressPercent}%)` : (task.status === "COMPLETED" ? "Completed (100%)" : "No items yet")}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist Items List */}
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Checklist</h4>
                    
                    {checklist.length === 0 ? (
                      <p className="text-xs italic text-slate-400 py-1">No checklist items yet. Add one below!</p>
                    ) : (
                      checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all group"
                        >
                          {editingItemId === item.id ? (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                type="text"
                                value={editingItemText}
                                onChange={(e) => setEditingItemText(e.target.value)}
                                className="flex-1 px-3 py-1 text-xs border border-indigo-300 dark:border-indigo-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditItem(task, item.id)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-200 rounded-md"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div
                                onClick={() => handleToggleItem(task, item.id)}
                                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                              >
                                {item.completed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className={`text-xs font-medium truncate ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {item.text}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => handleStartEditItem(item.id, item.text)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(task, item.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* + Add Checklist Item Input */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={newItemTexts[task.id] || ""}
                    onChange={(e) => setNewItemTexts(prev => ({ ...prev, [task.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem(task);
                      }
                    }}
                    placeholder="+ Add Checklist Item..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    onClick={() => handleAddItem(task)}
                    disabled={!newItemTexts[task.id]?.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal for Edit or Create */}
      <TodoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        taskToEdit={selectedTaskToEdit}
      />
    </div>
  );
}
