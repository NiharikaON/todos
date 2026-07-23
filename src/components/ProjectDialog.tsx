"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Project } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectRepository, storageRepository } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/FileUpload";
import { FileList } from "@/components/FileList";
import { useFileUpload } from "@/hooks/useFileUpload";
import { downloadFileDirectly } from "@/utils/download";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: Project | null;
}

export function ProjectDialog({ open, onOpenChange, projectToEdit }: ProjectDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!projectToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const {
    files,
    progress,
    isUploading,
    uploadFiles,
    removeFile,
    setInitialFiles,
  } = useFileUpload({
    entityType: "project",
    entityId: projectToEdit?.id || "new",
    maxFiles: 10,
  });

  useEffect(() => {
    if (open) {
      if (projectToEdit) {
        reset({
          name: projectToEdit.name,
          description: projectToEdit.description || "",
        });
        
        const initialFiles = projectToEdit.attachments ? projectToEdit.attachments.map(att => ({
          id: att.key,
          key: att.key,
          name: att.name,
          size: att.size,
          type: att.type,
          url: "",
          entityType: "project",
          entityId: projectToEdit.id,
          createdAt: projectToEdit.createdAt,
        })) : [];
        setInitialFiles(initialFiles);
      } else {
        reset({
          name: "",
          description: "",
        });
        setInitialFiles([]);
      }
    }
  }, [open, projectToEdit, reset, setInitialFiles]);

  const mutation = useMutation({
    mutationFn: (data: ProjectFormValues) => {
      const attachments = files.length > 0 ? files.map(file => ({
        key: file.key,
        name: file.name,
        type: file.type,
        size: file.size,
      })) : undefined;

      const submitData = {
        ...data,
        attachments,
      };

      if (isEditing && projectToEdit) {
        return projectRepository.updateProject(projectToEdit.id, submitData);
      } else {
        return projectRepository.createProject({
          ...submitData,
          ownerId: user?.id || "unknown",
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isEditing ? "Project updated" : "Project created");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("An error occurred");
    }
  });

  const onSubmit = (data: ProjectFormValues) => {
    mutation.mutate(data);
  };

  const handleFilesSelected = async (fileList: any) => {
    try {
      await uploadFiles(fileList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleDownloadFile = async (fileKey: string) => {
    try {
      const targetFile = files.find(f => f.key === fileKey);
      const fileName = targetFile ? targetFile.name : fileKey.split('/').pop() || "download";
      const url = await storageRepository.getFileUrl(fileKey);
      await downloadFileDirectly(url, fileName);
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleDeleteFile = async (fileKey: string) => {
    try {
      await removeFile(fileKey);
      toast.success("File removed");
    } catch (error) {
      toast.error("Failed to remove file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "Create Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <input
              id="name"
              {...register("name")}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="E.g. Q3 Marketing Launch"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Optional details..."
            />
          </div>

          <div className="space-y-3 pt-2">
            <Label>Attachments</Label>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              progress={progress}
              isUploading={isUploading}
              disabled={mutation.isPending}
            />
            <FileList
              files={files as any}
              onDownload={handleDownloadFile}
              onDelete={handleDeleteFile}
              disabled={mutation.isPending}
            />
          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || isUploading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
