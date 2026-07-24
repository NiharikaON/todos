"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { todoRepository } from "@/repositories";
import { useSearch } from "@/providers/SearchProvider";
import { 
  LayoutDashboard, 
  CheckSquare, 
  LogOut, 
  Bell, 
  Settings, 
  CalendarDays, 
  Hexagon,
  BarChart2,
  Search,
  ArrowLeft,
  User,
  Shield,
  Palette,
  Clock,
  StickyNote,
  Folder,
  ListChecks
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useSearch();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val && pathname !== "/todos") {
      router.push("/todos");
    }
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  const notifications = useMemo(() => {
    const now = new Date().getTime();
    return tasks
      .filter(t => t.status !== "COMPLETED" && (t.dueDate || t.startDate || t.endDate))
      .map(t => {
        const dateStr = t.endDate || t.dueDate || t.startDate;
        const targetTime = new Date(dateStr!).getTime();
        const isOverdue = targetTime < now;
        return {
          id: t.id,
          title: t.title,
          targetTime,
          isOverdue,
          priority: t.priority,
          status: t.status,
          dateStr,
        };
      })
      .sort((a, b) => a.targetTime - b.targetTime);
  }, [tasks]);

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Task", href: "/todos", icon: CheckSquare, badge: tasks.length.toString() },
    { name: "Sticky Notes", href: "/notes", icon: StickyNote },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Files", href: "/files", icon: Folder },
  ];

  const generalItems = [
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="flex h-screen w-full animated-bg overflow-hidden relative text-slate-800 dark:text-slate-200">
      
      {/* Sidebar */}
      <aside className="w-64 m-4 mr-2 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm flex-col z-10 hidden md:flex overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="p-6 pb-2 flex flex-col items-center justify-center mt-2 mb-4 shrink-0">
          <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center mb-2 shadow-sm">
             <CheckSquare className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Todo List</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
          <div className="mb-6">
            <h3 className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Menu</h3>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.name === "Task" && pathname === "/todos") || (item.name === "Analytics" && pathname.startsWith("/analytics"));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-semibold"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isActive ? "text-purple-600 dark:text-purple-400" : ""}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-purple-700 dark:bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mb-6">
            <h3 className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">General</h3>
            <nav className="space-y-1">
              {generalItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-semibold"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full group flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative z-0">
        
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 flex-shrink-0 mt-4">
          <div className="flex-1 max-w-xl flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              title="Go Back"
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95 border border-gray-100 dark:border-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="relative group flex items-center flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search tasks by name, priority, status..."
                className="block w-full pl-11 pr-5 py-3 border-none bg-white dark:bg-slate-900 rounded-full text-sm text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-6">
            <div className="relative">
              <button 
                title="Notifications" 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 shadow-sm transition-all relative active:scale-95 border border-gray-100 dark:border-slate-800"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                      Notifications & Reminders
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                      {notifications.length} active
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs font-medium">
                        🎉 All caught up! No pending reminders.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setIsNotificationOpen(false);
                            router.push("/todos");
                          }}
                          className="p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all cursor-pointer flex items-start justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center">
                              <Clock className="w-3 h-3 mr-1 shrink-0" />
                              {new Date(item.dateStr!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${item.isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'}`}>
                            {item.isOverdue ? "Overdue" : item.priority || "Reminder"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 ml-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                {/* Avatar with fallback */}
                <div className="w-full h-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="hidden sm:flex flex-col text-sm max-w-[240px]">
                <p className="font-bold text-gray-900 dark:text-white leading-tight truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 flex flex-col min-h-0">
          <div className="mt-2 flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
