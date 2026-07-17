"use client";

import { useQuery } from "@tanstack/react-query";
import { todoRepository, projectRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import { 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  FolderKanban,
  Activity,
  ArrowRight
} from "lucide-react";
import { DashboardChart } from "@/components/DashboardChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectRepository.getProjects(),
  });

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const completedTasks = tasks?.filter(t => t.status === "COMPLETED").length || 0;
  const pendingTasks = tasks?.filter(t => t.status !== "COMPLETED").length || 0;
  const totalProjects = projects?.length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-10 relative">
      {/* Decorative Background Blob */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 font-medium">
            Here&apos;s a quick overview of your workspace today.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/todos" className="block group">
          <Card className="h-full border-0 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl shadow-lg shadow-gray-200/50 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
            <CardContent className="p-6 flex items-center h-full relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors"></div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <ListTodo className="w-6 h-6" />
              </div>
              <div className="ml-5 relative z-10">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Tasks</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{tasks?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/todos" className="block group">
          <Card className="h-full border-0 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl shadow-lg shadow-gray-200/50 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/10">
            <CardContent className="p-6 flex items-center h-full relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full blur-2xl group-hover:bg-green-100 transition-colors"></div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="ml-5 relative z-10">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{completedTasks}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/todos" className="block group">
          <Card className="h-full border-0 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl shadow-lg shadow-gray-200/50 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10">
            <CardContent className="p-6 flex items-center h-full relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-50 dark:bg-yellow-900/20 rounded-full blur-2xl group-hover:bg-yellow-100 transition-colors"></div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <div className="ml-5 relative z-10">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{pendingTasks}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/projects" className="block group">
          <Card className="h-full border-0 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl shadow-lg shadow-gray-200/50 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10">
            <CardContent className="p-6 flex items-center h-full relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-2xl group-hover:bg-purple-100 transition-colors"></div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div className="ml-5 relative z-10">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Projects</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{totalProjects}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <Card className="lg:col-span-2 border-0 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl shadow-gray-200/30 dark:shadow-none overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20 px-8 py-6">
            <CardTitle className="text-xl font-bold">Productivity Trends</CardTitle>
            <CardDescription className="font-medium text-gray-500">Tasks completed over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <DashboardChart tasks={tasks} />
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="border-0 bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl shadow-xl shadow-gray-200/30 dark:shadow-none flex flex-col">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20 px-8 py-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </CardTitle>
            <CardDescription className="font-medium text-gray-500">Latest updates across your workspace</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {tasks?.slice(0, 4).map((task) => (
                <Link href="/todos" key={task.id} className="group block p-6 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
              {(!tasks || tasks.length === 0) && (
                <div className="p-8 text-center text-sm font-medium text-gray-500">
                  No activity yet. Create some tasks!
                </div>
              )}
            </div>
          </CardContent>
          {tasks && tasks.length > 4 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/20 text-center">
              <Link href="/todos" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors">
                View all activity
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Tasks Widget */}
      <div>
        <div className="flex items-center justify-between mb-6 mt-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-500" />
              Upcoming Tasks
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Tasks due in the next 7 days</p>
          </div>
          <Link href="/calendar" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg transition-colors">
            View Calendar
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const upcomingTasks = tasks
              ?.filter((t) => t.dueDate && t.status !== "COMPLETED")
              .filter((t) => {
                const dueDate = new Date(t.dueDate!);
                return dueDate >= now && dueDate <= nextWeek;
              })
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .slice(0, 6) || [];
            
            if (upcomingTasks.length === 0) {
              return (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">You&apos;re all caught up!</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">No upcoming tasks in the next 7 days.</p>
                </div>
              );
            }

            return upcomingTasks.map((task) => {
              let badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
              if (task.priority === "HIGH") badgeColor = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
              else if (task.priority === "MEDIUM") badgeColor = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
              else if (task.priority === "LOW") badgeColor = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";

              return (
                <Link href="/todos" key={task.id} className="group block">
                  <div className="flex flex-col p-6 h-full rounded-2xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${badgeColor}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {new Date(task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
