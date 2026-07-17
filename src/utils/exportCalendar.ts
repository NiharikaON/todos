import { Task } from "@/types";

export function exportTasksToCSV(tasks: Task[]) {
  const headers = ["Title", "Description", "Status", "Priority", "Start Date", "End Date", "Due Date", "Recurrence"];
  
  const csvRows = tasks.map(task => {
    return [
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || "").replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      task.startDate ? new Date(task.startDate).toISOString() : "",
      task.endDate ? new Date(task.endDate).toISOString() : "",
      task.dueDate ? new Date(task.dueDate).toISOString() : "",
      task.recurrenceRule || "NONE"
    ].join(",");
  });

  const csvContent = [headers.join(","), ...csvRows].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `todo-tasks-export-${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTasksToICS(tasks: Task[]) {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TodoEnterprise//Calendar//EN\n";

  tasks.forEach(task => {
    if (!task.startDate && !task.dueDate) return;

    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${task.id}\n`;
    
    const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split('.')[0] + "Z";
    icsContent += `DTSTAMP:${dtstamp}\n`;

    const dtstartStr = task.startDate || task.dueDate;
    if (dtstartStr) {
      const dtstart = new Date(dtstartStr).toISOString().replace(/[-:]/g, "").split('.')[0] + "Z";
      icsContent += `DTSTART:${dtstart}\n`;
    }

    const dtendStr = task.endDate;
    if (dtendStr) {
      const dtend = new Date(dtendStr).toISOString().replace(/[-:]/g, "").split('.')[0] + "Z";
      icsContent += `DTEND:${dtend}\n`;
    }

    if (task.recurrenceRule && task.recurrenceRule !== "NONE") {
      icsContent += `RRULE:${task.recurrenceRule}\n`;
    }

    icsContent += `SUMMARY:${task.title}\n`;
    if (task.description) {
      // Basic escaping for ICS
      const desc = task.description.replace(/\n/g, "\\n").replace(/,/g, "\\,");
      icsContent += `DESCRIPTION:${desc}\n`;
    }

    icsContent += "END:VEVENT\n";
  });

  icsContent += "END:VCALENDAR";

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `todo-calendar-export-${new Date().toISOString().slice(0,10)}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
