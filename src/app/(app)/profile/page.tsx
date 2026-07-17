"use client";

import { useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { User, Mail, Camera, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { authRepository, storageRepository, todoRepository } from "@/repositories";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
  });
  
  const completedTasksCount = tasks?.filter(t => t.status === "COMPLETED").length || 0;
  
  const memberSinceDate = useMemo(() => {
    if (!tasks || tasks.length === 0) return new Date();
    const oldestTask = tasks.reduce((oldest, current) => {
      return new Date(current.createdAt).getTime() < new Date(oldest.createdAt).getTime() ? current : oldest;
    }, tasks[0]);
    return new Date(oldestTask.createdAt);
  }, [tasks]);
  
  const formattedMemberSince = memberSinceDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setUploadingAvatar(true);
      const uploadedFile = await storageRepository.uploadFile(file, "avatars", user.id);
      const url = await storageRepository.getFileUrl(uploadedFile.key);
      await authRepository.updateAvatar(url);
      await refreshUser();
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: "I'm a productivity enthusiast trying to get things done.",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await authRepository.updateProfile(data.name);
      await refreshUser();
      toast.success("Profile updated successfully!");
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || "Failed to update profile");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your public profile and personal details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
                <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity ${uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {uploadingAvatar ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{user?.name || 'User'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'user@example.com'}</p>
              
              <div className="mt-6 w-full pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Tasks Completed</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{completedTasksCount}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Member Since</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formattedMemberSince}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        {...register("name")}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        {...register("email")}
                        disabled
                        className="flex h-10 w-full rounded-md border border-input bg-gray-50 pl-10 pr-3 py-2 text-sm text-gray-500 cursor-not-allowed dark:bg-gray-800/50 dark:text-gray-400"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed directly.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    rows={4}
                    {...register("bio")}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us a little bit about yourself"
                  />
                  {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
                  <p className="text-xs text-gray-500">Brief description for your profile. URLs are hyperlinked.</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    ) : (
                      <Save className="-ml-1 mr-2 h-4 w-4" />
                    )}
                    Save Profile
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
