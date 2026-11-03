import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repo = "mapleorzzz/PCC-Chart-Collection";
const maxFileSize = 4 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "画像ファイルを選択してください。" }, { status: 400 });
    }

    const extension = allowedTypes[file.type];
    if (!extension) {
      return NextResponse.json({ error: "JPEG・PNG・WebP・GIF形式の画像を選択してください。" }, { status: 400 });
    }
    if (file.size === 0 || file.size > maxFileSize) {
      return NextResponse.json({ error: "画像サイズは1 byte以上4 MB以下にしてください。" }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN is not configured");

    const original = file.name.replace(/\\.[^.]*$/, "");
    const safeName = original.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60) || "image";
    const filename = `${Date.now()}-${safeName}.${extension}`;
    const path = `public/uploads/${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const content = bytes.toString("base64");

    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `admin: upload image ${filename}`,
        content,
        branch: "main"
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.message || "GitHubへの画像アップロードに失敗しました。");
    }

    const imageUrl = `https://raw.githubusercontent.com/${repo}/main/${path}`;
    return NextResponse.json({ ok: true, name: filename, imageUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "画像アップロードに失敗しました。" },
      { status: 500 }
    );
  }
}
