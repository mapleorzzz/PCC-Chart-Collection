import { NextRequest, NextResponse } from "next/server";
import { getScheduledCharts, saveScheduledCharts } from "@/lib/scheduled-storage";

export const dynamic = "force-dynamic";

const repo = "mapleorzzz/PCC-Chart-Collection";
const chartsPath = "src/data/charts.json";

async function githubRequest(path: string, init?: RequestInit) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not configured");
  return fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
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

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [chartsRes, scheduled] = await Promise.all([githubRequest(chartsPath), getScheduledCharts()]);
    if (!chartsRes.ok) throw new Error("GitHubから公開データを取得できませんでした。");

    const chartsFile = await chartsRes.json();
    const charts = JSON.parse(Buffer.from(chartsFile.content, "base64").toString("utf8")) as Record<string, unknown>[];
    const now = Date.now();
    const due = scheduled.filter((item) =>
      item.status === "scheduled" && item.scheduledAt &&
      Number.isFinite(Date.parse(item.scheduledAt)) && Date.parse(item.scheduledAt) <= now
    );

    if (due.length === 0) return NextResponse.json({ ok: true, published: 0 });

    const dueIds = new Set(due.map((item) => item.id));
    const nextCharts = [...charts];
    for (const item of due) {
      if (!nextCharts.some((chart) => chart.id === item.chart.id)) nextCharts.push(item.chart);
    }

    const updateRes = await githubRequest(chartsPath, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "cron: publish scheduled charts",
        content: Buffer.from(JSON.stringify(nextCharts, null, 2) + "\n").toString("base64"),
        sha: chartsFile.sha,
        branch: "main"
      })
    });
    if (!updateRes.ok) {
      const detail = await updateRes.json().catch(() => ({}));
      throw new Error(detail.message || "GitHubへの公開に失敗しました。");
    }

    await saveScheduledCharts(scheduled.filter((item) => !dueIds.has(item.id)));
    return NextResponse.json({ ok: true, published: due.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "予約公開に失敗しました。" },
      { status: 500 }
    );
  }
}
