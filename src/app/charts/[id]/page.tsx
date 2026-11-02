import Link from "next/link";
import { notFound } from "next/navigation";
import { allCharts, allProjects, getChart } from "@/lib/data";

export function generateStaticParams() {
  return allCharts.map((chart) => ({ id: chart.id }));
}

export default async function ChartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chart = getChart(id);
  if (!chart) notFound();
  const projects = allProjects.filter((project) => chart.projectIds.includes(project.id));

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <Link href="/charts" className="text-xs text-neutral-500 hover:text-white">← ALL CHARTS</Link>
      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,340px)_1fr]">
        <div className="aspect-square border border-line bg-panel">
          {chart.jacket ? <img src={chart.jacket} alt={chart.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs tracking-widest text-neutral-700">NO JACKET</div>}
        </div>
        <div>
          <p className="text-[10px] tracking-[0.3em] text-neutral-600">CHART DETAILS</p>
          <h1 className="mt-4 text-3xl font-light sm:text-4xl">{chart.title}</h1>
          <p className="mt-3 text-sm text-neutral-500">{chart.artist}</p>
          <div className="mt-8 grid grid-cols-2 gap-5 border-y border-line py-6 text-sm">
            <div><p className="text-xs text-neutral-600">CHARTER</p><p className="mt-2">{chart.charter}</p></div>
            <div><p className="text-xs text-neutral-600">DIFFICULTY</p><p className="mt-2">{chart.difficulty} {chart.level}</p></div>
            <div><p className="text-xs text-neutral-600">PUBLISHED</p><p className="mt-2">{chart.publishedAt}</p></div>
            <div><p className="text-xs text-neutral-600">FORMAT</p><p className="mt-2">.pez</p></div>
          </div>
          {chart.description && <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-neutral-400">{chart.description}</p>}
          {projects.length > 0 && <div className="mt-8"><p className="text-[10px] tracking-widest text-neutral-600">PROJECTS</p><div className="mt-3 flex flex-wrap gap-2">{projects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="border border-line px-3 py-2 text-xs text-neutral-300 hover:border-white">{project.name}</Link>)}</div></div>}
          {chart.fileUrl ? <a href={chart.fileUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex bg-white px-5 py-3 text-xs font-medium tracking-wider text-black hover:bg-neutral-200">DOWNLOAD .PEZ ↗</a> : <p className="mt-8 border border-line px-5 py-3 text-xs text-neutral-600">ダウンロードファイルは準備中です。</p>}
        </div>
      </div>
    </div>
  );
}