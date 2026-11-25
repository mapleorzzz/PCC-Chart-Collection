import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Deployment = {
  uid?: string;
  id?: string;
  url?: string;
  name?: string;
  created?: number;
  state?: string;
  readyState?: string;
  target?: string | null;
  alias?: string[];
};

function config() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_ORG_ID;
  if (!token || !projectId || !teamId) {
    throw new Error("Vercel連携の設定がありません。VERCEL_TOKEN と VERCEL_ORG_ID を設定し、System Environment Variables を有効にしてください。");
  }
  return { token, projectId, teamId };
}

async function vercel(path: string, init?: RequestInit) {
  const { token, teamId } = config();
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
}

async function listProjectDeployments() {
  const { projectId } = config();
  const response = await vercel(`/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=100`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || body.message || "Vercelからデプロイ一覧を取得できませんでした。");
  return (Array.isArray(body.deployments) ? body.deployments : []) as Deployment[];
}

function getDeploymentId(item: Deployment) {
  return item.uid || item.id || "";
}

function isProtected(item: Deployment, deployments: Deployment[]) {
  const id = getDeploymentId(item);
  const newestProduction = deployments
    .filter((entry) => entry.target === "production")
    .sort((a, b) => (b.created || 0) - (a.created || 0))[0];
  return Boolean(id && newestProduction && getDeploymentId(newestProduction) === id);
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const deployments = await listProjectDeployments();
    return NextResponse.json({
      deployments: deployments.map((item) => ({
        id: getDeploymentId(item),
        url: item.url || "",
        name: item.name || "",
        created: item.created || 0,
        state: item.readyState || item.state || "UNKNOWN",
        target: item.target || "preview",
        protected: isProtected(item, deployments)
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "デプロイ一覧の取得に失敗しました。" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id || !/^dpl_[A-Za-z0-9]+$/.test(id)) {
      return NextResponse.json({ error: "削除対象のデプロイIDが不正です。" }, { status: 400 });
    }
    const deployments = await listProjectDeployments();
    const target = deployments.find((item) => getDeploymentId(item) === id);
    if (!target) return NextResponse.json({ error: "このプロジェクトのデプロイが見つかりません。" }, { status: 404 });
    if (isProtected(target, deployments)) {
      return NextResponse.json({ error: "最新のProductionデプロイは削除できません。" }, { status: 400 });
    }
    const state = target.readyState || target.state || "";
    if (["BUILDING", "QUEUED", "INITIALIZING"].includes(state)) {
      return NextResponse.json({ error: "ビルド中のデプロイは削除できません。" }, { status: 400 });
    }
    const response = await vercel(`/v13/deployments/${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error?.message || result.message || "デプロイの削除に失敗しました。");
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "デプロイの削除に失敗しました。" }, { status: 500 });
  }
}
