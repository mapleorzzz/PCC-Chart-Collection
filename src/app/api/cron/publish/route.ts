import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const repo = "mapleorzzz/PCC-Chart-Collection";
const paths = {
  charts: "src/data/charts.json",
  scheduled: "src/data/scheduled-charts.json"
};

type ScheduledItem = {
  id: string;
  chart: Record<string, unknown>;
  status: "scheduled" | "draft";
  scheduledAt?: string;
};

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
    const [chartsRes, scheduledRes] = await Promise.all([
      githubRequest(paths.charts),
      githubRequest(paths.scheduled)
    ]);
    if (!chartsRes.ok || !scheduledRes.ok) {
      throw new Error("GitHubから公開データを取得できませんでした。");
    }

    const [chartsFile, scheduledFile] = await Promise.all([chartsRes.json(), scheduledRes.json()]);
    const decode = (file: { content: string }) =>
      JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    const charts = decode(chartsFile) as Record<string, unknown>[];
    const scheduled = decode(scheduledFile) as ScheduledItem[];
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
    const remaining = scheduled.filter((item) => !dueIds.has(item.id));

    async function update(path: string, currentSha: string, data: unknown, message: string) {
      const response = await githubRequest(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          content: Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64"),
          sha: currentSha,
          branch: "main"
        })
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.message || "GitHubへの保存に失敗しました。");
      }
    }

    await update(paths.charts, chartsFile.sha, nextCharts, "cron: publish scheduled charts");
    await update(paths.scheduled, scheduledFile.sha, remaining, "cron: clear published charts");
    return NextResponse.json({ ok: true, published: due.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "予約公開に失敗しました。" },
      { status: 500 }
    );
  }
}
