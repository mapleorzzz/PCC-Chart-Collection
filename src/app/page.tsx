"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { groupCharts } from "@/lib/data";
import { usePublicData } from "@/lib/use-public-data";

export default function HomePage() {
  const { charts, projects, jacketOrder, loading, error } = usePublicData();
  const latest = groupCharts(charts).sort((a, b) => b.chart.publishedAt.localeCompare(a.chart.publishedAt)).slice(0, 4);
  const featuredProjects = projects.slice(0, 2);

  return (
    <div className="mx-auto max-w-7xl px-5">
      <section className="home-hero relative isolate left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen min-h-[calc(100svh-88px)] overflow-hidden border-b border-[#20294a] sm:min-h-[calc(100svh-104px)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_72%_48%,rgba(43,58,125,0.42),transparent_58%),linear-gradient(115deg,#070910_0%,#0b1020_52%,#111936_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 top-1/2 -z-10 h-[min(88vw,760px)] w-[min(88vw,760px)] -translate-y-1/2 opacity-[0.19] sm:right-[2%] sm:opacity-[0.23]">
          <img src="/pcc-header-logo.webp" alt="" className="h-full w-full scale-110 object-contain mix-blend-screen blur-[5px] sm:blur-[7px]" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#070910] via-[#080c18]/90 to-[#0b1020]/35" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(150,165,220,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(150,165,220,.12)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_right,black,transparent)]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-88px)] max-w-7xl flex-col justify-center px-5 py-16 sm:min-h-[calc(100svh-104px)] sm:px-10 sm:py-20 lg:px-14">
          <div className="mb-7 text-[10px] font-medium tracking-[0.38em] text-[#9ba9d8]">
            PHIGROS FANMADE ARCHIVE
          </div>
          <h1 className="max-w-3xl text-[clamp(3.2rem,8vw,6.8rem)] font-light leading-[0.98] tracking-[-0.065em] text-[#f4f6ff]">
            A collection of<br />
            <span className="bg-gradient-to-r from-white via-[#cbd5ff] to-[#778bd1] bg-clip-text text-transparent">fanmade charts.</span>
          </h1>
          <p className="mt-8 max-w-xl text-sm leading-8 text-[#a5aec9] sm:text-[15px]">
            PCCのメンバーによって製作されたPhigros Fanmadeの譜面と、コミュニティ企画を記録・共有するアーカイブ。
          </p>
          <div className="mt-11 flex flex-wrap gap-3">
            <Link href="/charts" className="group inline-flex items-center gap-4 border border-[#7186d2]/70 bg-[#283867]/55 px-6 py-4 text-xs font-medium tracking-[0.16em] text-white shadow-[0_0_35px_rgba(53,76,151,0.16)] backdrop-blur-sm transition hover:border-[#b8c6ff] hover:bg-[#34477f]/70">
              譜面を探す <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link href="/projects" className="group inline-flex items-center gap-4 border border-white/15 bg-black/20 px-6 py-4 text-xs tracking-[0.16em] text-[#d5daeb] backdrop-blur-sm transition hover:border-white/45 hover:bg-white/5">
              企画を見る <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-l from-[#7186d2]/60 to-transparent" />
      </section>
      <section className="py-20 sm:py-24">
        <div className="mb-9 flex items-end justify-between"><div><p className="text-[10px] tracking-[0.34em] text-[#7180ae]">COLLECTION / 01</p><h2 className="mt-3 text-2xl font-light tracking-wide text-[#edf0fb]">Latest charts</h2></div><Link href="/charts" className="group inline-flex items-center gap-2 text-[10px] tracking-[0.18em] text-[#8793b5] transition hover:text-white">VIEW ALL <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link></div>
        {loading ? <Loading /> : error ? <EmptyState message="データを読み込めませんでした。ページを再読み込みしてください。" /> : latest.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 sm:gap-x-6">{latest.map((group) => <ChartCard key={group.chart.id} chart={group.chart} group={group.charts} jacketOrder={jacketOrder} />)}</div> : <EmptyState message="譜面はまだ登録されていません。" />}
      </section>
      <section className="border-t border-[#20294a] py-20 sm:py-24">
        <div className="mb-9 flex items-end justify-between"><div><p className="text-[10px] tracking-[0.34em] text-[#7180ae]">COMMUNITY / 02</p><h2 className="mt-3 text-2xl font-light tracking-wide text-[#edf0fb]">Projects</h2></div><Link href="/projects" className="group inline-flex items-center gap-2 text-[10px] tracking-[0.18em] text-[#8793b5] transition hover:text-white">VIEW ALL <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link></div>
        {loading ? <Loading /> : error ? <EmptyState message="企画データを読み込めませんでした。" /> : featuredProjects.length ? <div className="grid gap-5 sm:grid-cols-2">{featuredProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="group overflow-hidden border border-[#252e4c] bg-[#0b1020]/70 transition duration-300 hover:-translate-y-1 hover:border-[#6378bd]/70 hover:shadow-[0_16px_50px_rgba(20,31,72,0.25)]"><div className="aspect-video overflow-hidden bg-[#10172b]">{project.cover ? <img src={project.cover} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[10px] tracking-[0.25em] text-[#586486]">NO COVER</div>}</div><div className="p-6"><p className="text-[10px] tracking-[0.2em] text-[#7482ad]">{project.year}</p><h3 className="mt-3 text-lg text-[#edf0fb]">{project.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#8993af]">{project.description}</p></div></Link>)}</div> : <EmptyState message="企画はまだ登録されていません。" />}
      </section>
    </div>
  );
}

function Loading() { return <div className="py-12 text-center text-xs text-neutral-600">LOADING...</div>; }
function EmptyState({ message }: { message: string }) { return <div className="border border-dashed border-[#293250] px-6 py-16 text-center text-sm text-[#7f89a5]">{message}</div>; }
