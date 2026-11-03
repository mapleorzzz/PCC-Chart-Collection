"use client";

import Link from "next/link";
import { usePublicData } from "@/lib/use-public-data";

export default function ProjectsPage() {
  const { projects, loading, error } = usePublicData();
  const years = [...new Set(projects.map((p) => p.year))].sort((a, b) => b - a);
  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <p className="text-[10px] tracking-[0.3em] text-neutral-600">COMMUNITY / EVENTS</p>
      <h1 className="mt-3 text-4xl font-light">Projects</h1>
      <p className="mt-3 text-sm text-neutral-500">PCCの企画・イベントの譜面をまとめています。</p>
      {loading ? <div className="mt-12 py-16 text-center text-xs text-neutral-600">LOADING...</div> : error ? <div className="mt-12 py-16 text-center text-sm text-neutral-500">データを読み込めませんでした。再読み込みしてください。</div> : years.length ? years.map((year) => <section key={year} className="mt-14"><h2 className="border-b border-line pb-4 text-xl font-light">{year}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.filter((p) => p.year === year).map((p) => <Link key={p.id} href={`/projects/${p.id}`} className="group border border-line p-6 transition hover:border-neutral-500"><p className="text-[10px] tracking-widest text-neutral-600">PROJECT / {p.year}</p><h3 className="mt-4 text-lg group-hover:text-white">{p.name}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-500">{p.description}</p><p className="mt-8 text-[10px] tracking-widest text-neutral-600">VIEW PROJECT ↗</p></Link>)}</div></section>) : <div className="mt-12 border border-dashed border-line px-6 py-20 text-center text-sm text-neutral-600">企画はまだ登録されていません。</div>}
    </div>
  );
}
