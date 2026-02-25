import { NextRequest } from "next/server";

const API_BASE = "https://api.guardiacontent.com";

/**
 * SSE proxy for granular shadow task progress events.
 * Backend endpoint created by Shadow 3: /luna/shadow-progress/stream
 * Events: shadow_task_claimed, shadow_task_done, shadow_task_retry
 */
export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE}/luna/shadow-progress/stream`, {
      headers: {
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to connect to shadow progress stream" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        const reader = response.body?.getReader();
        if (!reader) return;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (error) {
        console.error("Shadow progress SSE error:", error);
      } finally {
        try {
          await writer.close();
        } catch {
          // Ignore close errors
        }
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Failed to establish shadow progress SSE:", error);
    return new Response(
      JSON.stringify({ error: "Shadow progress stream unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
