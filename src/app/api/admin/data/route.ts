import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getScheduledCharts, saveScheduledCharts } from "@/lib/scheduled-storage";
import { githubAppRequest } from "@/lib/github-app";

const repo = "mapleorzzz/PCC-Chart-Collection";
const files = {
  charts: "src/data/charts.json",
  projects: "src/data/projects.json",
  jacketOrder: "src/data/jacket-order.json",
  chartOrder: "src/data/chart-order.json",
  bossAppearance: "src/data/boss-appearance.json"
} as const;

async function githubRequest(path: string, init?: RequestInit) {
  return githubAppRequest(`contents/${path}`, init);
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [chartsRes, projectsRes, jacketOrderRes, chartOrderRes, bossAppearanceRes, scheduledCharts] = await Promise.all([
      githubRequest(files.charts), githubRequest(files.projects), githubRequest(files.jacketOrder),
      githubRequest(files.chartOrder), githubRequest(files.bossAppearance), getScheduledCharts()
    ]);
    if (!chartsRes.ok || !projectsRes.ok || !jacketOrderRes.ok || !chartOrderRes.ok || !bossAppearanceRes.ok) {
      throw new Error("GitHubからデータを取得できませんでした。");
    }
    const [chartsFile, projectsFile, jacketOrderFile, chartOrderFile, bossAppearanceFile] = await Promise.all([
      chartsRes.json(), projectsRes.json(), jacketOrderRes.json(), chartOrderRes.json(), bossAppearanceRes.json()
    ]);
    const decode = (file: { content: string }) => JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    return NextResponse.json({
      charts: decode(chartsFile), projects: decode(projectsFile), scheduledCharts,
      jacketOrder: decode(jacketOrderFile), chartOrder: decode(chartOrderFile), bossAppearance: decode(bossAppearanceFile)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "データ取得に失敗しました。" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const kind = body?.kind as keyof typeof files | "scheduled";
  const data = body?.data;
  if (kind === "scheduled") {
    if (!Array.isArray(data)) return NextResponse.json({ error: "不正な予約投稿データです。" }, { status: 400 });
    try {
      await saveScheduledCharts(data);
      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "予約投稿の保存に失敗しました。" }, { status: 500 });
    }
  }
  if (!(kind in files) || ((kind === "jacketOrder" || kind === "chartOrder" || kind === "bossAppearance")
    ? !data || typeof data !== "object" || Array.isArray(data)
    : !Array.isArray(data))) {
    return NextResponse.json({ error: "不正なデータです。" }, { status: 400 });
  }

  try {
    const path = files[kind as keyof typeof files];
    const currentRes = await githubRequest(path);
    if (!currentRes.ok) throw new Error("GitHub上のデータファイルを読み込めませんでした。");
    const current = await currentRes.json();
    const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
    const updateRes = await githubRequest(path, {
      method: "PUT",
      body: JSON.stringify({ message: `admin: update ${kind} data`, content, sha: current.sha, branch: "main" }),
      headers: { "Content-Type": "application/json" }
    });
    if (!updateRes.ok) {
      const detail = await updateRes.json().catch(() => ({}));
      throw new Error(detail.message || "GitHubへの保存に失敗しました。");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存に失敗しました。" }, { status: 500 });
  }
}
