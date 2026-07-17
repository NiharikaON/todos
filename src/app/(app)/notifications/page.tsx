"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Circle, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import { notificationService } from "@/repositories";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@/repositories/interfaces";

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await notificationService.getNotifications(user.id);
    },
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.success("Marked as read");
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(user?.id || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.success("All notifications marked as read");
    },
  });

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    if (user) {
      markAllAsReadMutation.mutate();
    }
  };

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-3 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Stay updated on your workspace activity.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            Mark all as read
          </button>
        )}
        <button
          onClick={() => {
            const newNotif = {
              id: `test-${Date.now()}`,
              userId: user?.id || 'test-user',
              title: "Test Notification",
              message: "This is a simulated notification to check the UI.",
              read: false,
              createdAt: new Date().toISOString()
            };
            queryClient.setQueryData(["notifications", user?.id], (old: Notification[] = []) => [newNotif, ...old]);
            toast.success("Test notification created!");
          }}
          className="text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 px-4 py-2 rounded-lg transition-colors"
        >
          Simulate Notification
        </button>

      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={() => markAsRead(n.id)} />
          ))}
          {notifications.length === 0 && <EmptyState />}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {notifications.filter((n: Notification) => !n.read).map((n: Notification) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={() => markAsRead(n.id)} />
          ))}
          {notifications.filter((n: Notification) => !n.read).length === 0 && <EmptyState />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationCard({ notification, onMarkRead }: { notification: Notification, onMarkRead: () => void }) {
  return (
    <Card className={`transition-colors ${!notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800' : ''}`}>
      <CardContent className="p-4 sm:p-6 flex gap-4">
        <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!notification.read ? 'bg-indigo-600' : 'bg-transparent'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className={`text-sm font-semibold ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
            </div>
            <span className="flex-shrink-0 text-xs text-gray-500">
              {new Date(notification.createdAt).toLocaleDateString()}
            </span>
          </div>
          {!notification.read && (
            <button
              onClick={onMarkRead}
              className="mt-3 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark as read
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
      <Bell className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No notifications</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        You&apos;re all caught up!
      </p>
    </div>
  );
}
