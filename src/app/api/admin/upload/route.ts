import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repo = "mapleorzzz/PCC-Chart-Collection";
const releaseTag = "chart-files";
const maxFileSize = 4 * 1024 * 1024;

type ReleaseAsset = { id: number; name: string };
type Release = { id: number; assets: ReleaseAsset[] };

async function github(path: string, init?: RequestInit) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not configured");
  return fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: ".pezファイルを選択してください。" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pez")) {
      return NextResponse.json({ error: "アップロードできるのは .pez ファイルのみです。" }, { status: 400 });
    }
    if (file.size === 0 || file.size > maxFileSize) {
      return NextResponse.json({ error: "ファイルサイズは1 byte以上4 MB以下にしてください。" }, { status: 400 });
    }

    let releaseResponse = await github(`/releases/tags/${releaseTag}`);
    if (releaseResponse.status === 404) {
      releaseResponse = await github("/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag_name: releaseTag,
          name: "PCC Chart Files",
          body: "PCC Chart Collectionで配布するPhigros Fanmadeの譜面ファイル置き場です。"
        })
      });
    }
    if (!releaseResponse.ok) {
      const detail = await releaseResponse.json().catch(() => ({}));
      throw new Error(detail.message || "GitHub Releaseを取得・作成できませんでした。");
    }

    const release = await releaseResponse.json() as Release;
    const filename = file.name.replace(/[\\/]/g, "_").replace(/[^\w.()\- ]/g, "_");
    const existing = release.assets.find((asset) => asset.name === filename);
    if (existing) {
      const deleteResponse = await github(`/releases/assets/${existing.id}`, { method: "DELETE" });
      if (!deleteResponse.ok) throw new Error("同名ファイルの既存アセットを置き換えられませんでした。");
    }

    const uploadResponse = await fetch(
      `https://uploads.github.com/repos/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(filename)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/octet-stream"
        },
        body: await file.arrayBuffer(),
        cache: "no-store"
      }
    );
    if (!uploadResponse.ok) {
      const detail = await uploadResponse.json().catch(() => ({}));
      throw new Error(detail.message || "GitHub Releaseへのアップロードに失敗しました。");
    }
    const asset = await uploadResponse.json() as { browser_download_url: string; name: string };
    return NextResponse.json({ ok: true, name: asset.name, browserDownloadUrl: asset.browser_download_url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "アップロードに失敗しました。" },
      { status: 500 }
    );
  }
}
