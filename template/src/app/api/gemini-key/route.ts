import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const host = req.headers.get("host") || "";

  if (origin && !origin.includes(host)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - entry.lastReset > 60000) {
    entry.count = 0;
    entry.lastReset = now;
  }

  entry.count++;
  rateLimitMap.set(ip, entry);

  if (entry.count > 10) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Key not configured" }, { status: 500 });
  }

  return NextResponse.json({ key });
}
