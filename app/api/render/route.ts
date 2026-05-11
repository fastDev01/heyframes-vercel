import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { collectFiles, renderInSandbox } from "@/lib/sandbox";
import { PREVIEW_COMPOSITION_DIR } from "@/lib/preview";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    let files: Array<{ rel: string; content: Buffer }>;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({})) as {
        html?: string;
        files?: Record<string, string>; // filename → base64
      };

      if (body.html) {
        files = [
          { rel: "index.html", content: Buffer.from(body.html) },
          ...Object.entries(body.files ?? {}).map(([rel, b64]) => ({
            rel,
            content: Buffer.from(b64, "base64"),
          })),
        ];
      } else {
        files = await collectFiles(PREVIEW_COMPOSITION_DIR);
      }
    } else {
      files = await collectFiles(PREVIEW_COMPOSITION_DIR);
    }

    const { mp4 } = await renderInSandbox(files);

    const blob = await put(`renders/render-${Date.now()}.mp4`, mp4, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: true,
      allowOverwrite: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[/api/render] failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 },
    );
  }
}
