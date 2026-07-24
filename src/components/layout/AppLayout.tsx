"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { todoRepository } from "@/repositories";
import { useSearch } from "@/providers/SearchProvider";
import { useTheme } from "next-themes";
import { TodoDialog } from "@/components/TodoDialog";
import { 
  LayoutDashboard, 
  CheckSquare, 
  LogOut, 
  Bell, 
  Settings, 
  CalendarDays, 
  Search,
  ArrowLeft,
  User,
  Shield,
  Clock,
  StickyNote,
  Folder,
  Plus,
  Sun,
  Moon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Check,
  UserCheck
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useSearch();
  const { theme, setTheme } = useTheme();

  // Navigation & UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState("OrbitNexa Team");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

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
    { name: "Security", href: "/settings?tab=security", icon: Shield },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative text-slate-800 dark:text-slate-200">
      
      {/* Sidebar */}
      <aside className={`m-4 mr-2 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm flex flex-col z-20 hidden md:flex overflow-hidden border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ${
        isSidebarCollapsed ? "w-20" : "w-64"
      }`}>
        
        {/* Workspace Switcher Header */}
        <div className="p-4 pb-2 shrink-0 border-b border-slate-100 dark:border-slate-800/60">
          {!isSidebarCollapsed ? (
            <div className="relative">
              <button
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedWorkspace}</p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate">Enterprise SaaS</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
              </button>

              {/* Workspace Dropdown */}
              {isWorkspaceDropdownOpen && (
                <div className="absolute top-14 left-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95">
                  <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Workspace</p>
                  {["OrbitNexa Team", "Personal Workspace", "Engineering Sprint"].map((ws) => (
                    <button
                      key={ws}
                      onClick={() => {
                        setSelectedWorkspace(ws);
                        setIsWorkspaceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                        selectedWorkspace === ws ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{ws}</span>
                      {selectedWorkspace === ws && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Collapse Toggle Button */}
        <div className="px-4 py-2 flex justify-end shrink-0">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 space-y-6">
          <div>
            {!isSidebarCollapsed && (
              <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Menu</h3>
            )}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.name === "Task" && pathname === "/todos");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className={`group flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "justify-between px-3.5"} py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200"}`} />
                      {!isSidebarCollapsed && <span className="text-sm truncate">{item.name}</span>}
                    </div>
                    {!isSidebarCollapsed && item.badge && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900"}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            {!isSidebarCollapsed && (
              <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">General</h3>
            )}
            <nav className="space-y-1">
              {generalItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className={`group flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3.5"} py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                    {!isSidebarCollapsed && <span className="text-sm truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card at Sidebar Bottom */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 shrink-0">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              title="Logout"
              className="w-full flex justify-center py-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative z-0">
        
        {/* Sticky Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-8 flex-shrink-0 mt-4">
          
          {/* Header Left: Back Button & Global Search Bar */}
          <div className="flex-1 max-w-xl flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              title="Go Back"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 shadow-xs transition-all shrink-0 cursor-pointer active:scale-95 border border-slate-200/80 dark:border-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="relative group flex items-center flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search tasks by name, priority, status... (⌘K)"
                className="block w-full pl-11 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs transition-all"
              />
              <span className="hidden sm:block absolute right-3 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                ⌘K
              </span>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-3 ml-6">
            
            {/* Quick Add Task Button */}
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="hidden sm:inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
              Quick Task
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Theme"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/80 dark:border-slate-800 cursor-pointer shadow-xs"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                title="Notifications" 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-all relative active:scale-95 border border-slate-200/80 dark:border-slate-800"
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
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-indigo-600" />
                      Notifications & Reminders
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
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
                          className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex items-start justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center">
                              <Clock className="w-3 h-3 mr-1 shrink-0" />
                              {new Date(item.dateStr!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${item.isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'}`}>
                            {item.isOverdue ? "Overdue" : item.priority || "Reminder"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left max-w-[140px]">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{user?.email}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 mr-2.5 text-slate-400" />
                    Profile
                  </Link>

                  <Link
                    href="/settings?tab=security"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-2.5 text-slate-400" />
                    Security
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2.5 text-slate-400" />
                    Settings
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 flex flex-col min-h-0">
          <div className="mt-2 flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </div>
      </main>

      {/* Global Quick Task Creation Modal */}
      <TodoDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        taskToEdit={null}
      />
    </div>
  );
}
