"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChartCard } from "@/components/chart-card";
import { usePublicData } from "@/lib/use-public-data";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { charts, projects, loading, error } = usePublicData();
  const project = projects.find((item) => item.id === id);

  if (loading) return <div className="mx-auto max-w-7xl px-5 py-24 text-center text-xs text-neutral-600">LOADING...</div>;
  if (error) return <div className="mx-auto max-w-7xl px-5 py-24 text-center text-sm text-neutral-500">データを読み込めませんでした。再読み込みしてください。</div>;
  if (!project) return <div className="mx-auto max-w-7xl px-5 py-24 text-center"><p className="text-sm text-neutral-500">企画が見つかりません。</p><Link href="/projects" className="mt-5 inline-block text-xs text-neutral-400 hover:text-white">← PROJECTS</Link></div>;

  const relatedCharts = charts.filter((chart) => chart.projectIds.includes(project.id));
  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <Link href="/projects" className="text-xs text-neutral-500 hover:text-white">← PROJECTS</Link>
      <section className="mt-8 border-b border-line pb-12">
        <p className="text-[10px] tracking-[0.3em] text-neutral-600">PROJECT / {project.year}</p><h1 className="mt-4 text-4xl font-light sm:text-5xl">{project.name}</h1>
        <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-neutral-400">{project.description}</p>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-xs text-neutral-500">{project.organizer && <span>ORGANIZER: {project.organizer}</span>}{(project.startDate || project.endDate) && <span>PERIOD: {project.startDate || "TBA"} — {project.endDate || "TBA"}</span>}</div>
      </section>
      <section className="py-12">
        <div className="mb-8 flex items-end justify-between"><div><p className="text-[10px] tracking-[0.3em] text-neutral-600">PARTICIPATING CHARTS</p><h2 className="mt-2 text-2xl font-light">参加譜面</h2></div><span className="text-xs text-neutral-600">{relatedCharts.length} CHARTS</span></div>
        {relatedCharts.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 sm:gap-x-6">{relatedCharts.map((chart) => <ChartCard key={chart.id} chart={chart} />)}</div> : <div className="border border-dashed border-line px-6 py-16 text-center text-sm text-neutral-600">この企画の譜面はまだ登録されていません。</div>}
      </section>
    </div>
  );
}
