import { NextRequest } from "next/server";
import { realtimeManager } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keep-alive
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", message: "SSE connected to Wildfire RAG telemetry stream" })}\n\n`));

      // Subscribe to real-time events
      unsubscribe = realtimeManager.subscribe((event) => {
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.error("Error writing to SSE stream:", e);
        }
      });

      // Keep-alive heartbeat every 15s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        if (unsubscribe) unsubscribe();
        try {
          controller.close();
        } catch (e) {
          // ignore
        }
      });
    },
    cancel() {
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
