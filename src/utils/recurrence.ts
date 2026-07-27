import { Task } from "@/types";

export type RecurrencePattern = "NONE" | "DAILY" | "WEEKDAYS" | "WEEKLY" | "MONTHLY" | "YEARLY";

export function generateRecurringOccurrences(baseTask: Omit<Task, "id" | "createdAt" | "updatedAt"> & { id?: string }, pattern: RecurrencePattern, count: number = 3): Array<Omit<Task, "id" | "createdAt" | "updatedAt">> {
  if (pattern === "NONE" || count <= 0) return [];

  const baseDueDateStr = baseTask.dueDate || baseTask.endDate || baseTask.startDate || new Date().toISOString();
  const baseDueDate = new Date(baseDueDateStr);

  const occurrences: Array<Omit<Task, "id" | "createdAt" | "updatedAt">> = [];

  let currentDate = new Date(baseDueDate);

  for (let i = 1; i <= count; i++) {
    const nextDate = new Date(currentDate);

    switch (pattern) {
      case "DAILY":
        nextDate.setDate(nextDate.getDate() + 1);
        break;

      case "WEEKDAYS":
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6); // 0 = Sun, 6 = Sat
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

    currentDate = nextDate;
    const formattedDateStr = nextDate.toISOString();

    occurrences.push({
      ...baseTask,
      title: baseTask.title,
      dueDate: formattedDateStr,
      endDate: formattedDateStr,
      startDate: baseTask.startDate ? new Date(new Date(baseTask.startDate).getTime() + (nextDate.getTime() - baseDueDate.getTime())).toISOString() : formattedDateStr,
      status: "PENDING",
      originalTodoId: baseTask.id || null,
    });
  }

  return occurrences;
}
