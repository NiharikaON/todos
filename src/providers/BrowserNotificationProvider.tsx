"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { todoRepository } from "@/repositories";
import { Task } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";

export function BrowserNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const notifiedTasks = useRef<Set<string>>(new Set());

  // Fetch all tasks periodically
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
    refetchInterval: 15000, // Refetch every 15s to keep it fresh
    enabled: !!user,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => setPermission(perm));
      } else {
        setPermission(Notification.permission);
      }
    }
  }, []);

  useEffect(() => {
    if (!tasks) return;

    const interval = setInterval(() => {
      const now = new Date();

      tasks.forEach((task: Task) => {
        // Only notify for pending or in progress tasks
        if (task.status === "COMPLETED") return;
        if (!task.endDate && !task.dueDate && !task.startDate) return;
        if (!task.reminderSetting || task.reminderSetting === "NONE") return;

        // If we already notified for this task, skip it
        if (notifiedTasks.current.has(task.id)) return;

        // Target End Date & Time (falling back to dueDate or startDate)
        const targetTimeStr = task.endDate || task.dueDate || task.startDate;
        if (!targetTimeStr) return;
        
        const targetTime = new Date(targetTimeStr).getTime();
        
        // Calculate reminder time based on setting
        let offsetMs = 0;
        switch (task.reminderSetting) {
          case "0_MIN": offsetMs = 0; break;
          case "1_MIN": offsetMs = 1 * 60 * 1000; break;
          case "5_MIN": offsetMs = 5 * 60 * 1000; break;
          case "15_MIN": offsetMs = 15 * 60 * 1000; break;
          case "30_MIN": offsetMs = 30 * 60 * 1000; break;
          case "1_HOUR": offsetMs = 60 * 60 * 1000; break;
          case "1_DAY": offsetMs = 24 * 60 * 60 * 1000; break;
        }

        const notifyTime = targetTime - offsetMs;
        const timeDiff = now.getTime() - notifyTime;

        // Check if we are past the notification time (within a 2-minute window)
        if (timeDiff >= 0 && timeDiff < 120000) {
          let timeText = "";
          if (offsetMs === 0) timeText = "Due right now!";
          else if (offsetMs < 3600000) timeText = `Due in ${Math.round(offsetMs / 60000)} minute${Math.round(offsetMs / 60000) === 1 ? '' : 's'}.`;
          else if (offsetMs === 3600000) timeText = "Due in 1 hour.";
          else if (offsetMs === 86400000) timeText = "Due in 1 day.";
          else timeText = "Due soon.";

          const notificationMsg = `🔔 Task Reminder: "${task.title}" is ${timeText}`;

          // In-App Toast
          toast(notificationMsg, {
            duration: 6000,
            icon: '🔔',
          });

          // System Browser Notification
          if (permission === "granted" && typeof window !== "undefined" && "Notification" in window) {
            try {
              new Notification("🔔 Task End Date Reminder", {
                body: `${task.title}\n${timeText}`,
              });
            } catch (err) {
              console.error("Browser notification error:", err);
            }
          }

          notifiedTasks.current.add(task.id);
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [tasks, permission]);

  return <>{children}</>;
}
