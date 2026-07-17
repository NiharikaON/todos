"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectRepository, todoRepository } from "@/repositories";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { TodoDialog } from "@/components/TodoDialog";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const all = await projectRepository.getProjects();
      const p = all.find((x) => x.id === projectId);
      if (!p) throw new Error("Not found");
      return p;
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project not found</h2>
        <button onClick={() => router.push('/projects')} className="mt-4 text-indigo-600 hover:underline">
          Return to Projects
        </button>
      </div>
    );
  }

  // Filter tasks that belong to this project
  const projectTasks = tasks?.filter(t => t.projectId === projectId) || []; 

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <Link href="/projects" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Project Details & Tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Project Tasks</CardTitle>
              <button 
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Task
              </button>
            </CardHeader>
            <CardContent>
              {projectTasks.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No tasks in this project yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {projectTasks.map((task) => (
                    <li key={task.id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className={`text-sm ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                          {task.title}
                        </span>
                      </div>
                      <Badge variant={task.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-xs">
                        {task.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {project.description || "No description provided."}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</h4>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TodoDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        initialProjectId={projectId} 
      />
    </div>
  );
}
