type ListenerCallback = (data: any) => void;

class RealtimeEventManager {
  private listeners: Set<ListenerCallback> = new Set();

  public subscribe(callback: ListenerCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public notify(event: { type: string; data: any }) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error("Error dispatching real-time event:", err);
      }
    });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var realtimeEventManager: RealtimeEventManager | undefined;
}

export const realtimeManager =
  global.realtimeEventManager || new RealtimeEventManager();

if (!global.realtimeEventManager) {
  global.realtimeEventManager = realtimeManager;
}
