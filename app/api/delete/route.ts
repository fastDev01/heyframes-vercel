import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { url } = await req.json().catch(() => ({})) as { url?: string };
    if (!url) return NextResponse.json({ error: "No url provided" }, { status: 400 });

    await del(url);
    return NextResponse.json({ deleted: url });
  } catch (err) {
    console.error("[/api/delete] failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    );
  }
}
