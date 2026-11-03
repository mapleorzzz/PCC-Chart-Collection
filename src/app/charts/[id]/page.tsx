"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePublicData } from "@/lib/use-public-data";
import { formatLevel } from "@/lib/data";

export default function ChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { charts, projects, loading, error } = usePublicData();
  const chart = charts.find((item) => item.id === id);

  if (loading) return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-xs text-neutral-600">LOADING...</div>;
  if (error) return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-sm text-neutral-500">データを読み込めませんでした。再読み込みしてください。</div>;
  if (!chart) return <div className="mx-auto max-w-5xl px-5 py-24 text-center"><p className="text-sm text-neutral-500">譜面が見つかりません。</p><Link href="/charts" className="mt-5 inline-block text-xs text-neutral-400 hover:text-white">← ALL CHARTS</Link></div>;

  const relatedProjects = projects.filter((item) => chart.projectIds.includes(item.id));
  const youtubeId = (() => {
    if (!chart.youtubeUrl) return null;
    try {
      const url = new URL(chart.youtubeUrl);
      if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
      if (url.hostname.endsWith("youtube.com")) {
        if (url.pathname === "/watch") return url.searchParams.get("v");
        const parts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null;
      }
    } catch {}
    return null;
  })();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-5 sm:py-16">
      <Link href="/charts" className="text-xs text-neutral-500 hover:text-white">← ALL CHARTS</Link>
      <div className="mt-6 grid min-w-0 gap-7 md:mt-8 md:grid-cols-[minmax(0,340px)_1fr] md:gap-10">
        <div className="aspect-square border border-line bg-panel">{chart.jacket ? <img src={chart.jacket} alt={chart.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs tracking-widest text-neutral-700">NO JACKET</div>}</div>
        <div>
          <p className="text-[10px] tracking-[0.3em] text-neutral-600">CHART DETAILS</p><h1 className="mt-4 break-words text-2xl font-light sm:text-4xl">{chart.title}</h1><p className="mt-3 text-sm text-neutral-500">{chart.artist}</p>
          <div className="mt-8 grid grid-cols-2 gap-5 border-y border-line py-6 text-sm">
            <div><p className="text-xs text-neutral-600">CHARTER</p><p className="mt-2">{chart.charter}</p></div><div><p className="text-xs text-neutral-600">DIFFICULTY</p><p className="mt-2">{chart.difficulty} {formatLevel(chart.level)}</p></div><div><p className="text-xs text-neutral-600">PUBLISHED</p><p className="mt-2">{chart.publishedAt}</p></div><div><p className="text-xs text-neutral-600">FORMAT</p><p className="mt-2">.pez</p></div>
          </div>
          {chart.description && <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-neutral-400">{chart.description}</p>}
          {relatedProjects.length > 0 && <div className="mt-8"><p className="text-[10px] tracking-widest text-neutral-600">PROJECTS</p><div className="mt-3 flex flex-wrap gap-2">{relatedProjects.map((item) => <Link key={item.id} href={`/projects/${item.id}`} className="border border-line px-3 py-2 text-xs text-neutral-300 hover:border-white">{item.name}</Link>)}</div></div>}
          {chart.youtubeUrl && <section className="mt-8">
            <p className="mb-3 text-[10px] tracking-[0.3em] text-neutral-600">PLAY VIDEO</p>
            {youtubeId ? <div className="aspect-video overflow-hidden border border-line bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} title={`${chart.title} - YouTube`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <a href={chart.youtubeUrl} target="_blank" rel="noreferrer" className="text-sm text-neutral-300 underline underline-offset-4">YouTubeで動画を見る ↗</a>}
          </section>}
          {chart.fileUrl ? <a href={chart.fileUrl} className="mt-8 inline-flex min-h-12 w-full items-center justify-center bg-white px-5 py-3 text-xs font-medium tracking-wider text-black hover:bg-neutral-200 sm:w-auto" download>DOWNLOAD .PEZ ↓</a> : <p className="mt-8 border border-line px-5 py-3 text-xs text-neutral-600">ダウンロードファイルは準備中です。</p>}
        </div>
      </div>
    </div>
  );
}
