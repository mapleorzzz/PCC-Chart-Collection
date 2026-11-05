import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const repo = "mapleorzzz/PCC-Chart-Collection";
const files = {
  charts: "src/data/charts.json",
  projects: "src/data/projects.json",
  scheduled: "src/data/scheduled-charts.json",
  jacketOrder: "src/data/jacket-order.json"
} as const;

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

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [chartsRes, projectsRes, scheduledRes, jacketOrderRes] = await Promise.all([
      githubRequest(files.charts), githubRequest(files.projects), githubRequest(files.scheduled), githubRequest(files.jacketOrder)
    ]);
    if (!chartsRes.ok || !projectsRes.ok || !scheduledRes.ok || !jacketOrderRes.ok) throw new Error("GitHubからデータを取得できませんでした。");
    const [chartsFile, projectsFile, scheduledFile, jacketOrderFile] = await Promise.all([chartsRes.json(), projectsRes.json(), scheduledRes.json(), jacketOrderRes.json()]);
    const decode = (file: { content: string }) => JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
    return NextResponse.json({ charts: decode(chartsFile), projects: decode(projectsFile), scheduledCharts: decode(scheduledFile), jacketOrder: decode(jacketOrderFile) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "データ取得に失敗しました。" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const kind = body?.kind as keyof typeof files;
  const data = body?.data;
  if (!(kind in files) || (kind === "jacketOrder" ? !data || typeof data !== "object" || Array.isArray(data) : !Array.isArray(data))) return NextResponse.json({ error: "不正なデータです。" }, { status: 400 });

  try {
    const path = files[kind];
    const currentRes = await githubRequest(path);
    if (!currentRes.ok) throw new Error("GitHub上のデータファイルを読み込めませんでした。");
    const current = await currentRes.json();
    const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
    const updateRes = await githubRequest(path, {
      method: "PUT",
      body: JSON.stringify({
        message: `admin: update ${kind} data`,
        content,
        sha: current.sha,
        branch: "main"
      }),
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