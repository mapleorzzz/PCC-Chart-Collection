import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { allCharts, allProjects } from "@/lib/data";
import { ChartCard } from "@/components/chart-card";

export default function HomePage() {
  const latest = [...allCharts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 4);
  const featuredProjects = allProjects.slice(0, 2);

  return (
    <div className="mx-auto max-w-7xl px-5">
      <section className="border-b border-line py-24 sm:py-32">
        <p className="mb-5 text-[10px] tracking-[0.35em] text-neutral-500">PHIGROS FANMADE DATABASE</p>
        <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-tight sm:text-6xl">A collection of<br />fanmade charts.</h1>
        <p className="mt-6 max-w-xl text-sm leading-7 text-neutral-500">PCCのメンバーによって製作されたPhigros Fanmadeの譜面とコミュニティ企画を記録・共有する譜面倉庫。</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/charts" className="inline-flex items-center gap-3 bg-white px-5 py-3 text-xs font-medium tracking-wider text-black transition hover:bg-neutral-200">譜面を探す <ArrowUpRight size={14} /></Link>
          <Link href="/projects" className="inline-flex items-center gap-3 border border-neutral-700 px-5 py-3 text-xs tracking-wider text-white transition hover:border-white">企画を見る <ArrowUpRight size={14} /></Link>
        </div>
      </section>
      <section className="py-16">
        <div className="mb-8 flex items-end justify-between">
          <div><p className="text-[10px] tracking-[0.3em] text-neutral-600">COLLECTION</p><h2 className="mt-2 text-2xl font-light">Latest charts</h2></div>
          <Link href="/charts" className="text-xs text-neutral-500 hover:text-white">VIEW ALL ↗</Link>
        </div>
        {latest.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 sm:gap-x-6"><>{latest.map((chart) => <ChartCard key={chart.id} chart={chart} />)}</></div> : <EmptyState message="譜面はまだ登録されていません。" />}
      </section>
      <section className="border-t border-line py-16">
        <div className="mb-8 flex items-end justify-between"><div><p className="text-[10px] tracking-[0.3em] text-neutral-600">COMMUNITY EVENTS</p><h2 className="mt-2 text-2xl font-light">Projects</h2></div><Link href="/projects" className="text-xs text-neutral-500 hover:text-white">VIEW ALL ↗</Link></div>
        {featuredProjects.length ? <div className="grid gap-4 sm:grid-cols-2">{featuredProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="border border-line p-6 transition hover:border-neutral-500"><p className="text-[10px] tracking-widest text-neutral-600">{project.year}</p><h3 className="mt-3 text-lg">{project.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">{project.description}</p></Link>)}</div> : <EmptyState message="企画はまだ登録されていません。" />}
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="border border-dashed border-line px-6 py-16 text-center text-sm text-neutral-600">{message}</div>;
}
