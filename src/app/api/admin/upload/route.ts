import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getGitHubAppToken } from "@/lib/github-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repository = "mapleorzzz/PCC-Chart-Collection";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const safeName = fileName.replace(/[\\/]/g, "_").replace(/[^\w.()\- ]/g, "_").slice(-120);
    const assetName = `${Date.now()}-${safeName}`;
    const tag = `pcc-chart-${chartId}-${Date.now()}`;
    const { token } = await getGitHubAppToken();
    const releaseResponse = await fetch(`https://api.github.com/repos/${repository}/releases`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tag_name: tag, name: `PCC Chart ${chartId}`, draft: true, prerelease: false }),
      cache: "no-store"
    });
    const release = await releaseResponse.json().catch(() => ({})) as { id?: number; upload_url?: string; message?: string };
    if (!releaseResponse.ok || !release.id || !release.upload_url) {
      throw new Error(release.message || "Draft Releaseを作成できませんでした。");
    }
    const uploadUrl = release.upload_url.replace(/\{[^}]+\}$/, "");
    return NextResponse.json({
      ok: true,
      releaseId: release.id,
      tag,
      assetName,
      uploadUrl: `${uploadUrl}?name=${encodeURIComponent(assetName)}`,
      uploadToken: token,
      fileUrl: `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(assetName)}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Draft Releaseの作成に失敗しました。" },
      { status: 500 }
    );
  }
}
