import { NextRequest } from "next/server";

const API_BASE = "https://api.guardiacontent.com";

/**
 * SSE endpoint for Luna proactive notifications
 * Proxies the backend SSE stream to the frontend
 */
export async function GET(_request: NextRequest) {
  try {
    // Connect to backend SSE stream
    const response = await fetch(`${API_BASE}/luna/notifications/stream`, {
      headers: {
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to connect to notification stream" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a TransformStream to pass through the SSE data
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Pipe the response body to our stream
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
        console.error("SSE stream error:", error);
      } finally {
        try {
          await writer.close();
        } catch (_e) {
          // Ignore close errors
        }
      }
    })();

    // Return SSE response with proper headers
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("Failed to establish SSE connection:", error);
    return new Response(
      JSON.stringify({ error: "Failed to establish notification stream" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
