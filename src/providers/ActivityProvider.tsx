"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";

export interface ActivityItem {
  id: string;
  userId?: string;
  title: string;
  type: "task" | "project" | "file";
  status?: string;
  subtitle?: string;
  timestamp: string;
  href?: string;
}

interface ActivityContextType {
  activities: ActivityItem[];
  logActivity: (item: Omit<ActivityItem, "timestamp" | "userId">) => void;
  clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType>({
  activities: [],
  logActivity: () => {},
  clearActivities: () => {},
});

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const userKey = user?.id || user?.email || "guest";
  const storageKey = `todo_recent_activities_${userKey}`;

  // Load activities specific to the currently logged in user
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setActivities(Array.isArray(parsed) ? parsed : []);
      } else {
        setActivities([]);
      }
    } catch (e) {
      console.error("Failed to load activity history for user:", userKey, e);
      setActivities([]);
    }
  }, [userKey]);

  const logActivity = (item: Omit<ActivityItem, "timestamp" | "userId">) => {
    const currentUserId = user?.id || user?.email || "guest";
    const currentStorageKey = `todo_recent_activities_${currentUserId}`;

    setActivities((prev) => {
      const newItem: ActivityItem = {
        ...item,
        userId: currentUserId,
        timestamp: new Date().toISOString(),
      };
      // Remove any duplicate of the same ID/type so it moves to top
      const filtered = prev.filter((a) => !(a.id === item.id && a.type === item.type));
      const updated = [newItem, ...filtered].slice(0, 20); // Keep top 20 recent activities

      try {
        localStorage.setItem(currentStorageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save activity history", e);
      }
      return updated;
    });
  };

  const clearActivities = () => {
    setActivities([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("Failed to clear activity history", e);
    }
  };

  return (
    <ActivityContext.Provider value={{ activities, logActivity, clearActivities }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  return useContext(ActivityContext);
}
