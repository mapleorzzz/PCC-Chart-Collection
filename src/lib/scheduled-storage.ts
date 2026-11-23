import "server-only";
import { getGitHubAppToken } from "@/lib/github-app";

export type ScheduledChartRecord = {
  id: string;
  chart: Record<string, unknown>;
  status: "scheduled" | "draft";
  scheduledAt?: string;
  releaseId?: number;
};

const privateDataRepository = "mapleorzzz/PCC-Private-Data";
const storageTag = "pcc-private-scheduled-data";
const storageName = "PCC Private Scheduled Data";
const bodyMarker = "<!-- PCC_PRIVATE_SCHEDULED_DATA_V1 -->";
const maxBodyLength = 120_000;

type GitHubRelease = {
  id: number;
  tag_name: string;
  draft: boolean;
  body?: string | null;
  message?: string;
};

async function githubRequest(path: string, token: string, init?: RequestInit) {
  return fetch(`https://api.github.com/repos/mapleorzzz/PCC-Chart-Collection/${path.replace(/^\//, "")}`, {
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

function releaseBody(items: ScheduledChartRecord[]) {
  const body = `${bodyMarker}\n${JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    items
  })}`;
  if (body.length > maxBodyLength) {
    throw new Error("予約・下書きデータがGitHub Releaseの保存上限を超えています。不要な下書きを整理してください。");
  }
  return body;
}

function parseReleaseBody(body?: string | null): ScheduledChartRecord[] {
  if (!body?.startsWith(bodyMarker)) {
    throw new Error("GitHub上の予約・下書きデータを読み取れません。専用Draft Releaseの内容を変更しないでください。");
  }
  const parsed = JSON.parse(body.slice(bodyMarker.length).trim()) as
    | ScheduledChartRecord[]
    | { version?: number; items?: ScheduledChartRecord[] };
  const items = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) {
    throw new Error("GitHub上の予約・下書きデータの形式が正しくありません。");
  }
  return items;
}

async function findStorageRelease(token: string): Promise<GitHubRelease | null> {
  const response = await githubRequest(`releases/tags/${encodeURIComponent(storageTag)}`, token);
  if (response.status === 404) return null;
  const release = await response.json().catch(() => ({})) as GitHubRelease;
  if (!response.ok || !release.id) {
    throw new Error(release.message || "GitHubの予約・下書き用Draft Releaseを確認できませんでした。");
  }
  if (!release.draft) {
    throw new Error("予約・下書き用Draft Releaseが公開状態になっています。安全のため保存を停止しました。");
  }
  return release;
}

async function readLegacySupabase(): Promise<ScheduledChartRecord[]> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("予約・下書きデータの初回移行がまだです。Vercelに既存のSUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYを一時的に残したまま、管理画面を一度開いてください。");
  }
  const response = await fetch(`${url}/rest/v1/pcc_private_data?id=eq.scheduled_charts&select=data`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `旧予約データの読み込みに失敗しました（${response.status}）。`);
  }
  const rows = await response.json() as { data?: ScheduledChartRecord[] }[];
  return Array.isArray(rows[0]?.data) ? rows[0].data : [];
}

async function createStorageRelease(token: string, items: ScheduledChartRecord[]): Promise<GitHubRelease> {
  const response = await githubRequest("releases", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tag_name: storageTag,
      target_commitish: "main",
      name: storageName,
      body: releaseBody(items),
      draft: true,
      prerelease: true
    })
  });
  const release = await response.json().catch(() => ({})) as GitHubRelease;
  if (!response.ok || !release.id) {
    // A concurrent first request may have created the storage release already.
    if (response.status === 422) {
      const existing = await findStorageRelease(token);
      if (existing) return existing;
    }
    throw new Error(release.message || "予約・下書き保存用のDraft Releaseを作成できませんでした。");
  }
  return release;
}

async function getOrCreateStorageRelease(token: string): Promise<GitHubRelease> {
  const existing = await findStorageRelease(token);
  if (existing) return existing;

  // One-time migration: preserve all existing scheduled/draft records before Supabase is retired.
  const legacyItems = await readLegacySupabase();
  return createStorageRelease(token, legacyItems);
}

export async function getScheduledCharts(): Promise<ScheduledChartRecord[]> {
  const { token } = await getGitHubAppToken();
  const release = await getOrCreateStorageRelease(token);
  return parseReleaseBody(release.body);
}

export async function saveScheduledCharts(items: ScheduledChartRecord[]): Promise<void> {
  const { token } = await getGitHubAppToken();
  const release = await getOrCreateStorageRelease(token);
  const response = await githubRequest(`releases/${release.id}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: releaseBody(items), draft: true })
  });
  const result = await response.json().catch(() => ({})) as GitHubRelease;
  if (!response.ok || !result.id || !result.draft) {
    throw new Error(result.message || "GitHub Draft Releaseへの予約・下書き保存に失敗しました。");
  }
}
