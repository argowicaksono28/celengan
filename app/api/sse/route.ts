import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/session";
import { addSSEClient, removeSSEClient } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      addSSEClient(user.id, controller);

      // Send initial heartbeat
      const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(heartbeat));

      // Set up heartbeat interval
      const interval = setInterval(() => {
        try {
          const hb = `event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`;
          controller.enqueue(new TextEncoder().encode(hb));
        } catch {
          clearInterval(interval);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        removeSSEClient(user.id, controller);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
