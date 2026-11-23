import { NextRequest, NextResponse } from "next/server";
import { githubAppRequest } from "@/lib/github-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const privateRepository = "mapleorzzz/PCC-Private-Data";
const publicChartsUrl = "https://raw.githubusercontent.com/mapleorzzz/PCC-Chart-Collection/main/src/data/charts.json";

type PublicChart = { id?: string; fileUrl?: string };

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || "";
  const releaseId = Number(request.nextUrl.searchParams.get("releaseId"));
  const assetName = request.nextUrl.searchParams.get("asset") || "";
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id) ||
      !Number.isSafeInteger(releaseId) || releaseId <= 0 ||
      !assetName.toLowerCase().endsWith(".pez") ||
      assetName.length > 180 || /[\\/]/.test(assetName)) {
    return NextResponse.json({ error: "Invalid download request." }, { status: 400 });
  }

  try {
    const indexResponse = await fetch(publicChartsUrl, { cache: "no-store" });
    if (!indexResponse.ok) return NextResponse.json({ error: "Chart index unavailable." }, { status: 503 });
    const charts = await indexResponse.json() as PublicChart[];
    const chart = charts.find((item) => item.id === id);
    const expectedUrl = `https://pcc-chart-collection.vercel.app/api/pez?id=${encodeURIComponent(id)}&releaseId=${releaseId}&asset=${encodeURIComponent(assetName)}`;
    if (!chart || chart.fileUrl !== expectedUrl) {
      return NextResponse.json({ error: "This chart is not publicly available." }, { status: 404 });
    }

    const releaseResponse = await githubAppRequest(`releases/${releaseId}`, undefined, privateRepository);
    const release = await releaseResponse.json().catch(() => ({})) as {
      draft?: boolean;
      assets?: Array<{ id: number; name: string; size?: number }>;
      message?: string;
    };
    if (!releaseResponse.ok || release.draft !== true) {
      return NextResponse.json({ error: "Private chart release not found." }, { status: 404 });
    }
    const asset = release.assets?.find((item) => item.name === assetName);
    if (!asset?.id) return NextResponse.json({ error: "Chart file not found." }, { status: 404 });

    const assetResponse = await githubAppRequest(`releases/assets/${asset.id}`, {
      headers: { Accept: "application/octet-stream" },
      redirect: "manual"
    }, privateRepository);
    if (assetResponse.status >= 300 && assetResponse.status < 400) {
      const location = assetResponse.headers.get("location");
      if (!location) return NextResponse.json({ error: "Download URL unavailable." }, { status: 502 });
      return NextResponse.redirect(location, 302);
    }
    if (!assetResponse.ok || !assetResponse.body) {
      return NextResponse.json({ error: "Unable to retrieve chart file." }, { status: 502 });
    }
    return new Response(assetResponse.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(assetName)}`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Download failed." }, { status: 500 });
  }
}
