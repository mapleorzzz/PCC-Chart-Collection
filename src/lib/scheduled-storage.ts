import "server-only";

export type ScheduledChartRecord = {
  id: string;
  chart: Record<string, unknown>;
  status: "scheduled" | "draft";
  scheduledAt?: string;
  releaseId?: number;
};

const tableUrl = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が設定されていません。");
  return { url: `${url}/rest/v1/pcc_private_data`, key };
};

async function request(path: string, init?: RequestInit) {
  const { url, key } = tableUrl();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `非公開データベースへの接続に失敗しました（${response.status}）。`);
  }
  return response;
}

export async function getScheduledCharts(): Promise<ScheduledChartRecord[]> {
  const response = await request("?id=eq.scheduled_charts&select=data");
  const rows = await response.json() as { data: ScheduledChartRecord[] }[];
  return rows[0]?.data || [];
}

export async function saveScheduledCharts(items: ScheduledChartRecord[]): Promise<void> {
  await request("", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: "scheduled_charts", data: items })
  });
}
