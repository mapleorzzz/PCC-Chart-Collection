import { NextResponse } from "next/server";

const base = "https://raw.githubusercontent.com/mapleorzzz/PCC-Chart-Collection/main/src/data/";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [chartsRes, projectsRes, jacketOrderRes, bossAppearanceRes] = await Promise.all([
      fetch(base + "charts.json", { cache: "no-store" }),
      fetch(base + "projects.json", { cache: "no-store" }),
      fetch(base + "jacket-order.json", { cache: "no-store" }),
      fetch(base + "boss-appearance.json", { cache: "no-store" })
    ]);
    if (!chartsRes.ok || !projectsRes.ok || !jacketOrderRes.ok || !bossAppearanceRes.ok) {
      return NextResponse.json({ error: "データを取得できませんでした。" }, { status: 502 });
    }
    const [charts, projects, jacketOrder, bossAppearance] = await Promise.all([chartsRes.json(), projectsRes.json(), jacketOrderRes.json(), bossAppearanceRes.json()]);
    const publicCharts = charts.map(({ charterSearch: _privateSearch, ...chart }: Record<string, unknown>) => chart);
    return NextResponse.json({ charts: publicCharts, projects, jacketOrder, bossAppearance }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch {
    return NextResponse.json({ error: "データを取得できませんでした。" }, { status: 500 });
  }
}
