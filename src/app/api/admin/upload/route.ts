import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createPezSignedUploadUrl } from "@/lib/pez-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const chartId = typeof body.chartId === "string" ? body.chartId.trim() : "";
    const fileName = typeof body.fileName === "string" ? body.fileName : "";

    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(chartId)) {
      return NextResponse.json({ error: "先に正しい譜面IDを入力してください。" }, { status: 400 });
    }
    if (!fileName.toLowerCase().endsWith(".pez")) {
      return NextResponse.json({ error: ".pezファイルのみアップロードできます。" }, { status: 400 });
    }

    const safeName = fileName
      .replace(/[\\/]/g, "_")
      .replace(/[^\w.()\- ]/g, "_")
      .slice(-120);
    const objectPath = `charts/${chartId}/${Date.now()}-${safeName}`;
    const signedUrl = await createPezSignedUploadUrl(objectPath);
    const fileUrl = `/api/pez/${encodeURIComponent(chartId)}?key=${encodeURIComponent(objectPath)}`;

    return NextResponse.json({ ok: true, signedUrl, fileUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "アップロードURLを作成できませんでした。" },
      { status: 500 }
    );
  }
}
