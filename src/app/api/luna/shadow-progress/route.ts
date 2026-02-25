import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.guardiacontent.com";

/**
 * Polling endpoint for shadow task progress.
 * Proxies to backend /luna/shadow-progress (created by Shadow 3).
 * Returns active and recently completed tasks.
 */
export async function GET(_request: NextRequest) {
  try {
    const res = await fetch(`${API_BASE}/luna/shadow-progress`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Shadow progress unavailable" },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Shadow progress unavailable" },
      { status: 502 }
    );
  }
}
