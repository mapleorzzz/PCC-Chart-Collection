"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { JacketCarousel } from "@/components/jacket-carousel";
import { usePublicData } from "@/lib/use-public-data";
import { formatLevel, getOrderedJacketImages } from "@/lib/data";

export default function ChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { charts, jacketOrder, loading, error } = usePublicData();
  const chart = charts.find((item) => item.id === id);
  const groupKey = chart ? (chart.songId?.trim() || `chart:${chart.id}`) : "";
  const songCharts = chart ? charts.filter((item) => (item.songId?.trim() || `chart:${item.id}`) === groupKey)
    .sort((a, b) => ["EZ", "HD", "IN", "AT", "Other"].indexOf(a.difficulty) - ["EZ", "HD", "IN", "AT", "Other"].indexOf(b.difficulty)) : [];
  const jacketImages = getOrderedJacketImages(songCharts, jacketOrder);
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 scale-110 bg-cover bg-center opacity-35 blur-xl" style={{ backgroundImage: chart.jacket ? `url("${chart.jacket}")` : undefined }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_20%,rgba(19,112,91,0.25),transparent_55%),linear-gradient(180deg,rgba(3,8,8,0.72),#050707_72%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
        <div className="text-center">
          <Link href="/charts" className="inline-flex items-center gap-2 text-[10px] tracking-[0.28em] text-neutral-400 transition hover:text-white">← ALL CHARTS</Link>
          <p className="mt-8 text-xs font-medium tracking-[0.55em] text-emerald-200 sm:mt-10 sm:text-sm">B O S S&nbsp;&nbsp; C H A R T</p>
          <div className="mx-auto mt-5 flex max-w-3xl items-center gap-3 text-emerald-200/50"><span className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-300/50" /><span className="text-[9px] tracking-[0.35em]">PCC · SPECIAL ARCHIVE</span><span className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-300/50" /></div>
        </div>

        <section className="mx-auto mt-8 max-w-4xl text-center sm:mt-10">
          <div className="relative mx-auto w-full max-w-[min(76vw,390px)]">
            <div className="absolute -inset-3 border border-emerald-300/25 shadow-[0_0_55px_rgba(16,185,129,0.14)]" />
            <div className="absolute -inset-1 border border-amber-200/30" />
            <div className="relative aspect-square overflow-hidden border border-emerald-100/50 bg-[#0b1513] shadow-[0_25px_90px_rgba(0,0,0,0.65)]">
              <JacketCarousel images={jacketImages} alt={chart.title} />
            </div>
            <span className="absolute -left-3 -top-3 h-7 w-7 border-l-2 border-t-2 border-amber-200/80" />
            <span className="absolute -right-3 -top-3 h-7 w-7 border-r-2 border-t-2 border-amber-200/80" />
            <span className="absolute -bottom-3 -left-3 h-7 w-7 border-b-2 border-l-2 border-amber-200/80" />
            <span className="absolute -bottom-3 -right-3 h-7 w-7 border-b-2 border-r-2 border-amber-200/80" />
          </div>
          <p className="mt-8 text-[10px] tracking-[0.25em] text-emerald-100/65">BOSS ENCOUNTER · {songCharts.length} CHART{songCharts.length === 1 ? "" : "S"}</p>
          <h1 className="mt-2 break-words text-3xl font-light tracking-wide text-white drop-shadow-[0_2px_18px_rgba(16,185,129,0.22)] sm:text-5xl">{chart.title}</h1>
          <p className="mt-3 text-sm tracking-wide text-neutral-300">{chart.artist}</p>
        </section>

        <section className="mx-auto mt-12 max-w-5xl sm:mt-16">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><p className="text-[10px] tracking-[0.35em] text-emerald-200/70">BATTLE DATA</p><h2 className="mt-1 text-lg font-light tracking-wider">AVAILABLE CHARTS</h2></div>
            <span className="text-[10px] tabular-nums tracking-widest text-neutral-500">{String(songCharts.length).padStart(2,"0")} / CHARTS</span>
          </div>
          <div className="border-y border-emerald-100/30 bg-black/35 backdrop-blur-sm">
            {songCharts.map((entry, index) => (
              <div key={entry.id} className="grid gap-4 border-b border-white/10 px-4 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(180px,280px)] sm:items-center sm:px-7">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="w-7 shrink-0 text-xs tabular-nums text-emerald-200/55">{String(index + 1).padStart(2,"0")}</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-lg font-medium tracking-wider">{entry.difficulty}</span><span className="text-sm text-emerald-100/80">{formatLevel(entry.level)}</span></p>
                    <p className="mt-1 break-words text-xs text-neutral-400">CHARTER : {entry.charter}</p>
                    {entry.description && <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-neutral-500">{entry.description}</p>}
                  </div>
                </div>
                {entry.fileUrl ? <a href={entry.fileUrl} className="flex min-h-12 items-center justify-center border border-emerald-100/50 bg-emerald-50 px-5 text-xs font-medium tracking-[0.18em] text-[#07100e] shadow-[0_0_22px_rgba(16,185,129,0.10)] transition hover:border-amber-200 hover:bg-white hover:shadow-[0_0_28px_rgba(16,185,129,0.25)]" download>DOWNLOAD <span className="ml-2">↓</span></a> : <span className="flex min-h-12 items-center justify-center border border-white/10 bg-white/[0.03] text-xs tracking-wider text-neutral-500">FILE NOT AVAILABLE</span>}
              </div>
            ))}
          </div>
        </section>

        {videos.length > 0 && <section className="mx-auto mt-12 max-w-5xl sm:mt-16"><div className="mb-4"><p className="text-[10px] tracking-[0.35em] text-emerald-200/70">BATTLE RECORD</p><h2 className="mt-1 text-lg font-light tracking-wider">PLAY VIDEOS</h2></div><div className="grid gap-6 md:grid-cols-2">{videos.map(({ chart: videoChart, url, id: videoId }) => <div key={videoChart.id} className="border border-emerald-100/20 bg-black/40 p-3"><p className="mb-3 text-xs tracking-wider text-neutral-300">{videoChart.difficulty} {formatLevel(videoChart.level)}</p>{videoId ? <div className="aspect-video overflow-hidden bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={`${chart.title} - ${videoChart.difficulty} YouTube`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <a href={url} target="_blank" rel="noreferrer" className="text-sm text-neutral-300 underline underline-offset-4">YouTubeで動画を見る ↗</a>}</div>)}</div></section>}
        <div className="mx-auto mt-16 flex max-w-5xl items-center gap-3 text-emerald-100/35"><span className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-100/30" /><span className="text-[9px] tracking-[0.4em]">END OF RECORD</span><span className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-100/30" /></div>
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
