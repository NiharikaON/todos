import { IEventPublisher } from "@/repositories/interfaces";
import { AppEvent } from "@/types/events";

export class MockEventPublisher implements IEventPublisher {
  private events: AppEvent[] = [];

  async publish(event: AppEvent): Promise<void> {
    console.log("[MockEventPublisher] Publishing event:", event.type, event);
    this.events.push(event);
  }

  async publishBatch(events: AppEvent[]): Promise<void> {
    console.log(`[MockEventPublisher] Publishing batch of ${events.length} events`);
    events.forEach(e => this.publish(e));
  }

  // Helper for testing/debugging
  getPublishedEvents(): AppEvent[] {
    return [...this.events];
  }
}

export const mockEventPublisher = new MockEventPublisher();
