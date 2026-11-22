import { NextRequest, NextResponse } from "next/server";
import { createPezSignedDownloadUrl } from "@/lib/pez-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repo = "mapleorzzz/PCC-Chart-Collection";

type ChartRecord = { id?: string; fileUrl?: string };

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const objectPath = request.nextUrl.searchParams.get("key") || "";
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id) || !objectPath.startsWith(`charts/${id}/`) || objectPath.includes("..")) {
      return NextResponse.json({ error: "ファイルが見つかりません。" }, { status: 404 });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN が設定されていません。");
    const chartsResponse = await fetch(
      `https://api.github.com/repos/${repo}/contents/src/data/charts.json?ref=main`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28"
        },
        cache: "no-store"
      }
    );
    if (!chartsResponse.ok) {
      throw new Error("公開譜面データを確認できませんでした。");
    }
    const file = await chartsResponse.json() as { content?: string; encoding?: string };
    if (!file.content || file.encoding !== "base64") {
      throw new Error("公開譜面データを読み取れませんでした。");
    }
    const charts = JSON.parse(Buffer.from(file.content, "base64").toString("utf8")) as ChartRecord[];
    const chart = charts.find((item) => item.id === id);
    const requestedUrl = request.nextUrl.pathname + request.nextUrl.search;
    if (!chart || chart.fileUrl !== requestedUrl) {
      return NextResponse.json({ error: "この譜面ファイルはまだ公開されていません。" }, { status: 404 });
    }

    const signedUrl = await createPezSignedDownloadUrl(objectPath);
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "譜面ファイルを取得できませんでした。" },
      { status: 500 }
    );
  }
}
