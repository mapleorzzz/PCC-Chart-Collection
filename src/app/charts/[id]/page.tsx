"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { JacketCarousel } from "@/components/jacket-carousel";
import { usePublicData } from "@/lib/use-public-data";
import { formatLevel, getOrderedJacketImages } from "@/lib/data";

export default function ChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { charts, jacketOrder, bossAppearance, loading, error } = usePublicData();
  const chart = charts.find((item) => item.id === id);
  const groupKey = chart ? (chart.songId?.trim() || `chart:${chart.id}`) : "";
  const songCharts = chart ? charts.filter((item) => (item.songId?.trim() || `chart:${item.id}`) === groupKey)
    .sort((a, b) => ["EZ", "HD", "IN", "AT", "Other"].indexOf(a.difficulty) - ["EZ", "HD", "IN", "AT", "Other"].indexOf(b.difficulty)) : [];
  const jacketImages = getOrderedJacketImages(songCharts, jacketOrder);
  const currentBossAppearance = bossAppearance.songs[groupKey] || bossAppearance.default;
  const isBoss = songCharts.some((item) => item.isBoss);

  if (loading) return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-xs text-neutral-600">LOADING...</div>;
  if (error) return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-sm text-neutral-500">データを読み込めませんでした。再読み込みしてください。</div>;
  if (!chart) return <div className="mx-auto max-w-5xl px-5 py-24 text-center"><p className="text-sm text-neutral-500">譜面が見つかりません。</p><Link href="/charts" className="mt-5 inline-block text-xs text-neutral-400 hover:text-white">← ALL CHARTS</Link></div>;
  const videos = songCharts
    .filter((item) => item.youtubeUrl)
    .map((item) => {
      const youtubeUrl = item.youtubeUrl!;
      let youtubeId: string | null = null;
      try {
        const url = new URL(youtubeUrl);
        if (url.hostname === "youtu.be") youtubeId = url.pathname.slice(1).split("/")[0] || null;
        else if (url.hostname.endsWith("youtube.com")) {
          if (url.pathname === "/watch") youtubeId = url.searchParams.get("v");
          else {
            const parts = url.pathname.split("/").filter(Boolean);
            if (["embed", "shorts", "live"].includes(parts[0])) youtubeId = parts[1] || null;
          }
        }
      } catch {}
      return { chart: item, url: youtubeUrl, id: youtubeId };
    });

  if (isBoss) return (
    <main className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden bg-[#070b0b] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 scale-110 bg-cover bg-center opacity-60 blur-2xl brightness-[0.32] saturate-[0.75]" style={{ backgroundImage: chart.jacket ? `url("${chart.jacket}")` : undefined }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.48),rgba(0,0,0,0.78)_58%,#050505_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
        <div className="text-center">
          <Link href="/charts" className="inline-flex items-center gap-2 text-[10px] tracking-[0.28em] text-neutral-400 transition hover:text-white">← ALL CHARTS</Link>
          <p className="mt-8 text-xs font-medium tracking-[0.55em] text-neutral-300 sm:mt-10 sm:text-sm">B O S S&nbsp;&nbsp; C H A R T</p>
          <div className="mx-auto mt-5 flex max-w-3xl items-center gap-3"><span className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${currentBossAppearance.lineColor})` }} /><span className="text-[9px] tracking-[0.35em]" style={{ color: currentBossAppearance.labelColor }}>{currentBossAppearance.labelText || "PCC · SPECIAL ARCHIVE"}</span><span className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${currentBossAppearance.lineColor})` }} /></div>
        </div>

        <section className="mx-auto mt-8 max-w-4xl text-center sm:mt-10">
          <div className="relative mx-auto w-full max-w-[min(76vw,390px)]">
            <div className="absolute -inset-3 border shadow-[0_0_55px_rgba(0,0,0,0.35)]" style={{ borderColor: currentBossAppearance.frameColor }} />
            <div className="absolute -inset-1 border" style={{ borderColor: currentBossAppearance.frameColor }} />
            <div className="relative aspect-square overflow-hidden border bg-[#111111] shadow-[0_25px_90px_rgba(0,0,0,0.65)]" style={{ borderColor: currentBossAppearance.frameColor }}>
              <JacketCarousel images={jacketImages} alt={chart.title} />
            </div>
            <span className="absolute -left-3 -top-3 h-7 w-7" style={{ backgroundImage: `linear-gradient(to right, ${currentBossAppearance.cornerGradientStart}, ${currentBossAppearance.cornerGradientEnd}), linear-gradient(to bottom, ${currentBossAppearance.cornerGradientStart}, ${currentBossAppearance.cornerGradientEnd})`, backgroundSize: "100% 2px, 2px 100%", backgroundPosition: "top left", backgroundRepeat: "no-repeat" }} />
            <span className="absolute -right-3 -top-3 h-7 w-7" style={{ backgroundImage: `linear-gradient(to left, ${currentBossAppearance.cornerGradientStart}, ${currentBossAppearance.cornerGradientEnd}), linear-gradient(to bottom, ${currentBossAppearance.cornerGradientStart}, ${currentBossAppearance.cornerGradientEnd})`, backgroundSize: "100% 2px, 2px 100%", backgroundPosition: "top right", backgroundRepeat: "no-repeat" }} />
            <span className="absolute -bottom-3 -left-3 h-7 w-7" style={{ backgroundImage: `linear-gradient(to right, ${currentBossAppearance.cornerGradientStart}, ${currentBossAppearance.cornerGradientEnd}), linear-gradient(to top, ${currentBossAppearance.cornerGradientStart}, ${currentBossAppearance.cornerGradientEnd})`, backgroundSize: "100% 2px, 2px 100%", backgroundPosition: "bottom left", backgroundRepeat: "no-repeat" }} />
            <span className="absolute -bottom-3 -right-3 h-7 w-7" style={{ backgroundImage: `linear-gradient(to left, ${currentBossAppearance.cornerGradientStart}, ${currentBossAppearance.cornerGradientEnd}), linear-gradient(to top, ${currentBossAppearance.cornerGradientStart}, ${currentBossAppearance.cornerGradientEnd})`, backgroundSize: "100% 2px, 2px 100%", backgroundPosition: "bottom right", backgroundRepeat: "no-repeat" }} />
          </div>
          <h1 className="mt-10 break-words text-3xl font-light tracking-wide text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:mt-12 sm:text-5xl">{chart.title}</h1>
          <p className="mt-3 text-sm tracking-wide text-neutral-300">{chart.artist}</p>
        </section>

        <section className="mx-auto mt-12 max-w-5xl sm:mt-16">
          <div className="border-y border-white/25 bg-black/35 backdrop-blur-sm">
            {songCharts.map((entry, index) => (
              <div key={entry.id} className="grid gap-4 border-b border-white/10 px-4 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(180px,280px)] sm:items-center sm:px-7">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="w-7 shrink-0 text-xs tabular-nums text-neutral-500">{String(index + 1).padStart(2,"0")}</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-1 gap-y-1"><span className="text-sm font-medium tracking-wider">{entry.difficulty}</span><span className="text-sm text-neutral-300">{formatLevel(entry.level)}</span></p>
                    <p className="mt-1 break-words text-xs text-neutral-400">CHARTER : {entry.charter}</p>
                    {entry.description && <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-neutral-500">{entry.description}</p>}
                  </div>
                </div>
                {entry.fileUrl ? <a href={entry.fileUrl} className="flex min-h-12 items-center justify-center border border-white/70 bg-white px-5 text-xs font-medium tracking-[0.18em] text-black transition hover:border-white hover:bg-neutral-200 hover:shadow-[0_0_28px_rgba(255,255,255,0.12)]" download>DOWNLOAD <span className="ml-2">↓</span></a> : <span className="flex min-h-12 items-center justify-center border border-white/10 bg-white/[0.03] text-xs tracking-wider text-neutral-500">FILE NOT AVAILABLE</span>}
              </div>
            ))}
          </div>
        </section>

        {videos.length > 0 && <section className="mx-auto mt-12 max-w-5xl sm:mt-16"><div className="mb-4"><h2 className="text-lg font-light tracking-wider">PLAY VIDEOS</h2></div><div className="grid gap-6 md:grid-cols-2">{videos.map(({ chart: videoChart, url, id: videoId }) => <div key={videoChart.id} className="border border-white/15 bg-black/40 p-3"><p className="mb-3 text-xs tracking-wider text-neutral-300">{videoChart.difficulty} {formatLevel(videoChart.level)}</p>{videoId ? <div className="aspect-video overflow-hidden bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={`${chart.title} - ${videoChart.difficulty} YouTube`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <a href={url} target="_blank" rel="noreferrer" className="text-sm text-neutral-300 underline underline-offset-4">YouTubeで動画を見る ↗</a>}</div>)}</div></section>}
      </div>
    </main>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-5 sm:py-16">
      <Link href="/charts" className="text-xs text-neutral-500 hover:text-white">← ALL CHARTS</Link>
      <div className="mt-6 grid min-w-0 gap-7 md:mt-8 md:grid-cols-[minmax(0,340px)_1fr] md:gap-10">
        <div className="relative aspect-square overflow-hidden border border-line bg-panel"><JacketCarousel images={jacketImages} alt={chart.title} /></div>
        <div>
          <h1 className="mt-4 break-words text-2xl font-light sm:text-4xl">{chart.title}</h1>
          <p className="mt-3 text-sm text-neutral-500">{chart.artist}</p>
          <section className="mt-8">
            <p className="mb-3 text-[10px] tracking-[0.3em] text-neutral-600">AVAILABLE CHARTS</p>
            <div className="divide-y divide-line border-y border-line">
              {songCharts.map((entry) => (
                <div key={entry.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                  <div><p className="text-sm">{entry.difficulty} <span className="text-neutral-400">{formatLevel(entry.level)}</span></p><p className="mt-1 text-xs text-neutral-500">Charter: {entry.charter} · {entry.publishedAt}</p>{entry.description && <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-neutral-500">{entry.description}</p>}</div>
                  {entry.fileUrl ? <a href={entry.fileUrl} className="inline-flex min-h-10 items-center justify-center bg-white px-4 py-2 text-[10px] font-medium tracking-wider text-black hover:bg-neutral-200" download>DOWNLOAD .PEZ ↓</a> : <span className="text-xs text-neutral-600">ファイル準備中</span>}
                </div>
              ))}
            </div>
          </section>
          {videos.length > 0 && <section className="mt-8"><p className="mb-3 text-[10px] tracking-[0.3em] text-neutral-600">PLAY VIDEO</p><div className="grid gap-6">{videos.map(({ chart: videoChart, url, id: videoId }) => <div key={videoChart.id}><p className="mb-2 text-xs text-neutral-400">{videoChart.difficulty} {formatLevel(videoChart.level)}</p>{videoId ? <div className="aspect-video overflow-hidden border border-line bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={`${chart.title} - ${videoChart.difficulty} YouTube`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <a href={url} target="_blank" rel="noreferrer" className="text-sm text-neutral-300 underline underline-offset-4">YouTubeで動画を見る ↗</a>}</div>)}</div></section>}
        </div>
      </div>
    </div>
  );
}
