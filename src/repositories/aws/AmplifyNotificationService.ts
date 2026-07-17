import { INotificationService, Notification } from "@/repositories/interfaces";
import { generateClient } from "aws-amplify/api";

const getNotificationsQuery = `
  query GetNotifications($userId: String!) {
    getNotifications(userId: $userId) {
      id
      userId
      title
      message
      read
      createdAt
    }
  }
`;

const markNotificationReadMutation = `
  mutation MarkNotificationRead($id: ID!, $userId: String!) {
    markNotificationRead(id: $id, userId: $userId) {
      id
      read
    }
  }
`;

const markAllNotificationsReadMutation = `
  mutation MarkAllNotificationsRead($userId: String!) {
    markAllNotificationsRead(userId: $userId)
  }
`;

export class AmplifyNotificationService implements INotificationService {
  async send(userId: string, data: Omit<Notification, "id" | "createdAt" | "read">): Promise<void> {
    console.warn("[AmplifyNotificationService] Client should not send notifications directly. Used for mocks only.");
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const response = await generateClient().graphql({
        query: getNotificationsQuery,
        variables: { userId },
      });
      return (response as any).data?.getNotifications || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // In a real app we would get the current user ID, but we assume the UI passes it if needed.
      // Wait, the interface doesn't pass userId to markAsRead, so we might need a workaround.
      // Since it's AppSync and we need userId for authorization/partition key, let's just pass a dummy or get it.
      // Actually, since this is called from the UI, let's get the user ID from auth.
      // We can import the auth adapter.
      const { amplifyAuthRepository } = await import('./AmplifyAuthRepository');
      const user = await amplifyAuthRepository.getCurrentUser();
      if (!user) throw new Error("Unauthorized");
      
      await generateClient().graphql({
        query: markNotificationReadMutation,
        variables: { id: notificationId, userId: user.id },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await generateClient().graphql({
        query: markAllNotificationsReadMutation,
        variables: { userId },
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }
}

export const amplifyNotificationService = new AmplifyNotificationService();
