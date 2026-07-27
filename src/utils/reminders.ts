import { Task } from "@/types";

export type ReminderSetting = 
  | "NONE" 
  | "AT_DUE_TIME" 
  | "5_MIN" 
  | "15_MIN" 
  | "30_MIN" 
  | "1_HOUR" 
  | "1_DAY";

export function getReminderOffsetMs(setting: ReminderSetting): number {
  switch (setting) {
    case "AT_DUE_TIME":
      return 0;
    case "5_MIN":
      return 5 * 60 * 1000;
    case "15_MIN":
      return 15 * 60 * 1000;
    case "30_MIN":
      return 30 * 60 * 1000;
    case "1_HOUR":
      return 60 * 60 * 1000;
    case "1_DAY":
      return 24 * 60 * 60 * 1000;
    default:
      return -1;
  }
}

export function scheduleTaskReminderNotification(task: Task) {
  if (!task.reminderSetting || task.reminderSetting === "NONE") return;
  const targetDateStr = task.dueDate || task.endDate || task.startDate;
  if (!targetDateStr) return;

  const targetTime = new Date(targetDateStr).getTime();
  const offsetMs = getReminderOffsetMs(task.reminderSetting as ReminderSetting);
  if (offsetMs < 0) return;

  const triggerTime = targetTime - offsetMs;
  const delayMs = triggerTime - Date.now();

  if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(`Reminder: ${task.title}`, {
          body: `Task "${task.title}" is due soon. Priority: ${task.priority}`,
          icon: "/favicon.ico",
        });
      }
    }, delayMs);
  }
}
