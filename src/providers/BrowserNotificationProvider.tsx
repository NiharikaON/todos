"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { todoRepository } from "@/repositories";
import { Task } from "@/types";

export function BrowserNotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const notifiedTasks = useRef<Set<string>>(new Set());

  // Fetch all tasks periodically
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => todoRepository.getTasks(),
    refetchInterval: 30000, // Refetch every 30s to keep it fresh
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
    if (permission !== "granted" || !tasks) return;

    const interval = setInterval(() => {
      const now = new Date();

      tasks.forEach((task: Task) => {
        // Only notify for pending or in progress tasks
        if (task.status === "COMPLETED") return;
        if (!task.startDate && !task.dueDate) return;
        if (!task.reminderSetting || task.reminderSetting === "NONE") return;

        // If we already notified for this task, skip it
        if (notifiedTasks.current.has(task.id)) return;

        const targetTimeStr = task.startDate || task.dueDate;
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

        // Check if we are past the notification time but within a 2-minute window to avoid spamming old tasks
        // Use 120000 ms to give a little leeway in case they just tabbed in
        if (timeDiff >= 0 && timeDiff < 120000) {
          let timeText = "";
          if (offsetMs === 0) timeText = "Starting now!";
          else if (offsetMs < 6000000) timeText = `Starts in ${offsetMs / 60000} minute${offsetMs / 60000 === 1 ? '' : 's'}.`;
          else timeText = `Starts soon.`;

          new Notification("🔔 Reminder", {
            body: `${task.title}\n${timeText}`,
          });

          notifiedTasks.current.add(task.id);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks, permission]);

  return <>{children}</>;
}
