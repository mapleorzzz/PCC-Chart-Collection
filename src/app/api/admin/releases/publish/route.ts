import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { githubAppRequest } from "@/lib/github-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Releases in PCC-Private-Data must remain drafts. Public access is granted
// only by the published chart index and the authenticated download proxy.
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => null);
    const releaseId = Number(body?.releaseId);
    if (!Number.isSafeInteger(releaseId) || releaseId <= 0) {
      return NextResponse.json({ error: "Release IDが不正です。" }, { status: 400 });
    }
    const response = await githubAppRequest(`releases/${releaseId}`, undefined, "mapleorzzz/PCC-Private-Data");
    const result = await response.json().catch(() => ({})) as { draft?: boolean; message?: string };
    if (!response.ok || result.draft !== true) {
      throw new Error(result.message || "非公開Releaseを確認できませんでした。");
    }
    return NextResponse.json({ ok: true, private: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "非公開Releaseの確認に失敗しました。" }, { status: 500 });
  }
}
