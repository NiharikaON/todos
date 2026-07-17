import { INotificationService, Notification } from "@/repositories/interfaces";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

export class MockNotificationService implements INotificationService {
  private notifications: Notification[] = [
    {
      id: "1",
      userId: "mock-user-123",
      title: "Welcome to Todo Master",
      message: "Thanks for joining! Get started by creating your first task.",
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      userId: "mock-user-123",
      title: "New Project Assigned",
      message: "You have been assigned to 'Q3 Marketing Campaign'.",
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: "3",
      userId: "mock-user-123",
      title: "Task Overdue",
      message: "The task 'Finish presentation deck' is overdue by 2 days.",
      read: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    }
  ];

  async send(userId: string, data: Omit<Notification, "id" | "createdAt" | "read">): Promise<void> {
    const notification: Notification = {
      id: uuidv4(),
      userId,
      title: data.title,
      message: data.message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    this.notifications.unshift(notification);
    
    // Simulate push notification
    if (typeof window !== "undefined") {
      toast.success(`New Notification: ${data.title}`);
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notifications.filter(n => n.userId === userId || n.userId === "mock-user-123");
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.notifications.forEach(n => {
      if (n.userId === userId || n.userId === "mock-user-123") {
        n.read = true;
      }
    });
  }
}

export const mockNotificationService = new MockNotificationService();
