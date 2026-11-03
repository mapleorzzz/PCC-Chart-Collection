"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePublicData } from "@/lib/use-public-data";

export default function ChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { charts, projects, loading, error } = usePublicData();
  const chart = charts.find((item) => item.id === id);

  if (loading) return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-xs text-neutral-600">LOADING...</div>;
  if (error) return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-sm text-neutral-500">データを読み込めませんでした。再読み込みしてください。</div>;
  if (!chart) return <div className="mx-auto max-w-5xl px-5 py-24 text-center"><p className="text-sm text-neutral-500">譜面が見つかりません。</p><Link href="/charts" className="mt-5 inline-block text-xs text-neutral-400 hover:text-white">← ALL CHARTS</Link></div>;

  const relatedProjects = projects.filter((item) => chart.projectIds.includes(item.id));
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <Link href="/charts" className="text-xs text-neutral-500 hover:text-white">← ALL CHARTS</Link>
      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,340px)_1fr]">
        <div className="aspect-square border border-line bg-panel">{chart.jacket ? <img src={chart.jacket} alt={chart.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs tracking-widest text-neutral-700">NO JACKET</div>}</div>
        <div>
          <p className="text-[10px] tracking-[0.3em] text-neutral-600">CHART DETAILS</p><h1 className="mt-4 text-3xl font-light sm:text-4xl">{chart.title}</h1><p className="mt-3 text-sm text-neutral-500">{chart.artist}</p>
          <div className="mt-8 grid grid-cols-2 gap-5 border-y border-line py-6 text-sm">
            <div><p className="text-xs text-neutral-600">CHARTER</p><p className="mt-2">{chart.charter}</p></div><div><p className="text-xs text-neutral-600">DIFFICULTY</p><p className="mt-2">{chart.difficulty} {chart.level}</p></div><div><p className="text-xs text-neutral-600">PUBLISHED</p><p className="mt-2">{chart.publishedAt}</p></div><div><p className="text-xs text-neutral-600">FORMAT</p><p className="mt-2">.pez</p></div>
          </div>
          {chart.description && <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-neutral-400">{chart.description}</p>}
          {relatedProjects.length > 0 && <div className="mt-8"><p className="text-[10px] tracking-widest text-neutral-600">PROJECTS</p><div className="mt-3 flex flex-wrap gap-2">{relatedProjects.map((item) => <Link key={item.id} href={`/projects/${item.id}`} className="border border-line px-3 py-2 text-xs text-neutral-300 hover:border-white">{item.name}</Link>)}</div></div>}
          {chart.fileUrl ? <a href={chart.fileUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex bg-white px-5 py-3 text-xs font-medium tracking-wider text-black hover:bg-neutral-200">DOWNLOAD .PEZ ↗</a> : <p className="mt-8 border border-line px-5 py-3 text-xs text-neutral-600">ダウンロードファイルは準備中です。</p>}
        </div>
      </div>
    </div>
  );
}
