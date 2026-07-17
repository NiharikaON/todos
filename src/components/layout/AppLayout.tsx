"use client";

import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, User, LogOut, FolderOpen, Bell, Settings, CalendarDays, Folder } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await logout();
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/todos", icon: CheckSquare },
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Files", href: "/files", icon: Folder },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Todo SaaS</h1>
          <ThemeToggle />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4 px-4 text-sm text-gray-500 dark:text-gray-400 truncate">
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
