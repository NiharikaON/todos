import { IEventPublisher } from "@/repositories/interfaces";
import { AppEvent } from "@/types/events";

export class EventBridgePublisher implements IEventPublisher {
  async publish(event: AppEvent): Promise<void> {
    // In a real AWS setup, this would either:
    // 1. Call API Gateway which triggers Lambda -> EventBridge
    // 2. Or call AppSync mutation which triggers Lambda -> EventBridge
    console.warn("[EventBridgePublisher] AWS EventBridge not fully configured. Event:", event);
    throw new Error("EventBridgePublisher not implemented");
  }

  async publishBatch(events: AppEvent[]): Promise<void> {
    console.warn(`[EventBridgePublisher] AWS EventBridge not fully configured. Batch size: ${events.length}`);
    throw new Error("EventBridgePublisher not implemented");
  }
}

export const eventBridgePublisher = new EventBridgePublisher();
