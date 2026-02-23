import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.guardiacontent.com";

/**
 * Proxy for decomposition status endpoint.
 * Backend: /luna/decomposition/{feature_name} (created by Shadow 3).
 * Returns tasks, dependency edges, and progress for a decomposed feature.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feature: string }> }
) {
  const { feature } = await params;
  try {
    const res = await fetch(
      `${API_BASE}/luna/decomposition/${encodeURIComponent(feature)}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Decomposition status unavailable" },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Decomposition status unavailable" },
      { status: 502 }
    );
  }
}
