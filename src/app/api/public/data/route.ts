import { NextResponse } from "next/server";

const base = "https://raw.githubusercontent.com/mapleorzzz/PCC-Chart-Collection/main/src/data/";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [chartsRes, projectsRes] = await Promise.all([
      fetch(base + "charts.json", { cache: "no-store" }),
      fetch(base + "projects.json", { cache: "no-store" })
    ]);
    if (!chartsRes.ok || !projectsRes.ok) {
      return NextResponse.json({ error: "データを取得できませんでした。" }, { status: 502 });
    }
    const [charts, projects] = await Promise.all([chartsRes.json(), projectsRes.json()]);
    return NextResponse.json({ charts, projects }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch {
    return NextResponse.json({ error: "データを取得できませんでした。" }, { status: 500 });
  }
}
