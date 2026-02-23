import { NextRequest, NextResponse } from "next/server";

const LIBA_BASE = "http://localhost:8200";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = `${LIBA_BASE}/liba/${path.join("/")}${request.nextUrl.search}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Libra unavailable" }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = `${LIBA_BASE}/liba/${path.join("/")}${request.nextUrl.search}`;
  try {
    let body: string | undefined;
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = JSON.stringify(await request.json());
    }
    const res = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Libra unavailable" }, { status: 502 });
  }
}
