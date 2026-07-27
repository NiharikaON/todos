import { Task, RepeatPattern, ReminderType, ReminderInterval } from "@/types";

export function getRepeatBadgeText(pattern?: string | null): string | null {
  if (!pattern || pattern === "NONE") return null;
  switch (pattern) {
    case "DAILY": return "🔁 Daily";
    case "WEEKDAYS": return "🔁 Weekdays";
    case "WEEKLY": return "🔁 Weekly";
    case "MONTHLY": return "🔁 Monthly";
    case "YEARLY": return "🔁 Yearly";
    default: return `🔁 ${pattern}`;
  }
}

export function getReminderBadgeText(task: Task): string | null {
  const type = task.reminderType || (task.reminderSetting && task.reminderSetting !== "NONE" ? "ONE_TIME" : "NONE");
  if (type === "NONE") return null;

  if (type === "ONE_TIME") {
    const setting = task.reminderSetting || "AT_DUE_TIME";
    switch (setting) {
      case "AT_DUE_TIME": return "⏰ At Due Time";
      case "5_MIN": return "⏰ 5 Mins Before";
      case "15_MIN": return "⏰ 15 Mins Before";
      case "30_MIN": return "⏰ 30 Mins Before";
      case "1_HOUR": return "⏰ 1 Hour Before";
      case "1_DAY": return "⏰ 1 Day Before";
      default: return `⏰ Reminder (${setting})`;
    }
  }

  if (type === "REPEATING") {
    const interval = task.reminderInterval || "2_HOURS";
    let intervalLabel = "2 Hours";
    switch (interval) {
      case "30_MIN": intervalLabel = "30 Mins"; break;
      case "1_HOUR": intervalLabel = "1 Hour"; break;
      case "2_HOURS": intervalLabel = "2 Hours"; break;
      case "3_HOURS": intervalLabel = "3 Hours"; break;
      case "4_HOURS": intervalLabel = "4 Hours"; break;
      case "CUSTOM":
        intervalLabel = `${task.customReminderIntervalMinutes || 60} Mins`;
        break;
    }
    const repeatLabel = task.repeat && task.repeat !== "NONE" ? `${getRepeatBadgeText(task.repeat)?.replace("🔁 ", "")} ` : "";
    return `⏰ ${repeatLabel}Every ${intervalLabel}`;
  }

  return null;
}

export function calculateNextOneTimeReminder(task: Partial<Task>): string | null {
  const setting = task.reminderSetting;
  if (!setting || setting === "NONE") return null;

  const dueRaw = task.dueDate || task.endDate || task.startDate;
  if (!dueRaw) return null;

  let targetDate = new Date(dueRaw);
  if (task.dueTime) {
    const [hrs, mins] = task.dueTime.split(":").map(Number);
    targetDate.setHours(hrs, mins, 0, 0);
  }

  const offsetMinutes: Record<string, number> = {
    AT_DUE_TIME: 0,
    "5_MIN": 5,
    "15_MIN": 15,
    "30_MIN": 30,
    "1_HOUR": 60,
    "1_DAY": 24 * 60,
  };

  const minutesToSubtract = offsetMinutes[setting] ?? 0;
  const reminderTimeMs = targetDate.getTime() - minutesToSubtract * 60 * 1000;
  return new Date(reminderTimeMs).toISOString();
}

export function calculateNextRepeatingReminder(task: Partial<Task>, nowRef: Date = new Date()): string | null {
  const startTimeStr = task.reminderStartTime || "08:00";
  const endTimeStr = task.reminderEndTime || "22:00";

  let intervalMins = 120; // Default 2 hours
  switch (task.reminderInterval) {
    case "30_MIN": intervalMins = 30; break;
    case "1_HOUR": intervalMins = 60; break;
    case "2_HOURS": intervalMins = 120; break;
    case "3_HOURS": intervalMins = 180; break;
    case "4_HOURS": intervalMins = 240; break;
    case "CUSTOM":
      intervalMins = Math.max(1, task.customReminderIntervalMinutes || 60);
      break;
  }

  const [startHr, startMin] = startTimeStr.split(":").map(Number);
  const [endHr, endMin] = endTimeStr.split(":").map(Number);

  // Generate today's slot candidate dates
  const year = nowRef.getFullYear();
  const month = nowRef.getMonth();
  const date = nowRef.getDate();

  const windowStart = new Date(year, month, date, startHr, startMin, 0, 0);
  const windowEnd = new Date(year, month, date, endHr, endMin, 0, 0);

  // Generate slots for today
  let curr = new Date(windowStart);
  while (curr <= windowEnd) {
    if (curr.getTime() > nowRef.getTime()) {
      return curr.toISOString();
    }
    curr = new Date(curr.getTime() + intervalMins * 60 * 1000);
  }

  // If all today's slots have passed, return tomorrow's first start slot
  const tomorrowStart = new Date(year, month, date + 1, startHr, startMin, 0, 0);
  return tomorrowStart.toISOString();
}

export function calculateNextOccurrenceDate(task: Partial<Task>, baseDate: Date = new Date()): string {
  const pattern = task.repeat || "NONE";
  const nextDate = new Date(baseDate);

  switch (pattern) {
    case "DAILY":
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case "WEEKDAYS":
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6); // Skip Sat & Sun
      break;

    case "WEEKLY":
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;

    case "YEARLY":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;

    default:
      break;
  }

  return nextDate.toISOString();
}
