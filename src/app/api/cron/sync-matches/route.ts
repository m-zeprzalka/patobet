import { NextResponse, type NextRequest } from "next/server";

import { syncOpenFootball } from "@/lib/openfootball/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron sync — drużyny + harmonogram + wyniki z OpenFootball.
 * Zabezpieczone CRON_SECRET (header `Authorization: Bearer <CRON_SECRET>`).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncOpenFootball();
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
