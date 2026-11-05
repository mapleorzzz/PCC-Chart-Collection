import { NextRequest, NextResponse } from "next/server";

const chartsUrl = "https://raw.githubusercontent.com/mapleorzzz/PCC-Chart-Collection/main/src/data/charts.json";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("charter") || "").trim().toLocaleLowerCase();
  if (!query) return NextResponse.json({ ids: [] });
  try {
    const response = await fetch(chartsUrl, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ ids: [] }, { status: 502 });
    const charts = await response.json() as Array<{ id: string; charterSearch?: string[] }>;
    const ids = charts.filter((chart) => (chart.charterSearch || []).some((name) => name.toLocaleLowerCase().includes(query))).map((chart) => chart.id);
    return NextResponse.json({ ids }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ ids: [] }, { status: 500 });
  }
}
