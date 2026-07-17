"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectRepository } from "@/repositories";
import { Plus, FolderKanban, MoreVertical, Edit2, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ProjectDialog } from "@/components/ProjectDialog";
import { Project } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectRepository.getProjects(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectRepository.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: () => {
      toast.error("Failed to delete project");
    }
  });

  const handleEdit = (project: Project) => {
    setProjectToEdit(project);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setProjectToEdit(null);
    setIsDialogOpen(true);
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
        Failed to load projects.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your project workspaces</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Create Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full inline-flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(project)} className="cursor-pointer">
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this project?")) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                    className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/20 dark:focus:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                {project.description || "No description provided."}
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <Link 
                href={`/projects/${project.id}`}
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                View Project <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No projects</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new project.
            </p>
          </div>
        )}
      </div>

      <ProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        projectToEdit={projectToEdit}
      />
    </div>
  );
}
