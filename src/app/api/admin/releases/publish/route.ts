import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { githubAppRequest } from "@/lib/github-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => null);
    const releaseId = Number(body?.releaseId);
    if (!Number.isSafeInteger(releaseId) || releaseId <= 0) {
      return NextResponse.json({ error: "Release IDが不正です。" }, { status: 400 });
    }
    const response = await githubAppRequest(`releases/${releaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: false })
    });
    const result = await response.json().catch(() => ({})) as { draft?: boolean; html_url?: string; message?: string };
    if (!response.ok || result.draft !== false) throw new Error(result.message || "Releaseを公開できませんでした。");
    return NextResponse.json({ ok: true, url: result.html_url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Releaseの公開に失敗しました。" }, { status: 500 });
  }
}
