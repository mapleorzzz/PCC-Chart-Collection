"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ChartCard } from "@/components/chart-card";
import { groupCharts } from "@/lib/data";
import { usePublicData } from "@/lib/use-public-data";

export default function ChartsPage() {
  const { charts, projects, jacketOrder, loading, error } = usePublicData();
  const [hiddenCharterMatches, setHiddenCharterMatches] = useState<string[]>([]);
  useEffect(() => {
    const term = query.trim();
    if (!term) { setHiddenCharterMatches([]); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      fetch(`/api/public/search?charter=${encodeURIComponent(term)}`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : { ids: [] })
        .then((result: { ids?: string[] }) => { if (active) setHiddenCharterMatches(result.ids || []); })
        .catch(() => { if (active) setHiddenCharterMatches([]); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("ALL");
  const [project, setProject] = useState("ALL");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => groupCharts(charts.filter((chart) => {
    const text = [chart.title, chart.artist, chart.charter].join(" ").toLowerCase();
    return (text.includes(query.toLowerCase()) || hiddenCharterMatches.includes(chart.id)) &&
      (difficulty === "ALL" || chart.difficulty === difficulty) &&
      (project === "ALL" || chart.projectIds.includes(project));
  })).sort((a, b) => {
    if (sort === "oldest") return a.chart.publishedAt.localeCompare(b.chart.publishedAt);
    if (sort === "title") return a.chart.title.localeCompare(b.chart.title, "ja");
    if (sort === "level-desc" || sort === "level-asc") {
      const parseLevel = (value: string) => {
        const match = value.match(/\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : Number.NaN;
      };
      const levelA = parseLevel(a.chart.level);
      const levelB = parseLevel(b.chart.level);
      const validA = Number.isFinite(levelA);
      const validB = Number.isFinite(levelB);
      if (validA !== validB) return validA ? -1 : 1;
      if (validA && validB && levelA !== levelB) {
        return sort === "level-desc" ? levelB - levelA : levelA - levelB;
      }
      return a.chart.title.localeCompare(b.chart.title, "ja");
    }
    return b.chart.publishedAt.localeCompare(a.chart.publishedAt);
  }), [charts, query, difficulty, project, sort, hiddenCharterMatches]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <p className="text-[10px] tracking-[0.3em] text-neutral-600">DATABASE / CHARTS</p>
      <h1 className="mt-3 text-4xl font-light">All charts</h1>
      <p className="mt-3 text-sm text-neutral-500">登録されている譜面を検索・絞り込みできます。</p>
      <div className="mt-10 grid gap-3 md:grid-cols-[1fr_160px_200px_160px]">
        <label className="flex items-center gap-3 border border-line bg-panel px-4"><Search size={15} className="text-neutral-600" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="曲名・アーティスト・製作者" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-neutral-700" /></label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border border-line bg-panel px-3 py-3 text-sm outline-none"><option>ALL</option>{["EZ","HD","IN","AT","Other"].map((d) => <option key={d}>{d}</option>)}</select>
        <select value={project} onChange={(e) => setProject(e.target.value)} className="border border-line bg-panel px-3 py-3 text-sm outline-none"><option value="ALL">すべての企画</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-line bg-panel px-3 py-3 text-sm outline-none"><option value="newest">新しい順</option><option value="oldest">古い順</option><option value="title">曲名順</option><option value="level-desc">レベルが高い順</option><option value="level-asc">レベルが低い順</option></select>
      </div>
      <div className="mb-6 mt-8 flex items-center justify-between text-xs text-neutral-600"><span>{loading ? "LOADING..." : `${filtered.length} SONGS · ${filtered.reduce((sum, item) => sum + item.charts.length, 0)} CHARTS`}</span><span className="flex items-center gap-2"><SlidersHorizontal size={13} /> GRID VIEW</span></div>
      {loading ? <div className="py-16 text-center text-xs text-neutral-600">LOADING...</div> : error ? <div className="py-16 text-center text-sm text-neutral-500">データを読み込めませんでした。再読み込みしてください。</div> : filtered.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 sm:gap-x-6">{filtered.map((group) => <ChartCard key={group.chart.id} chart={group.chart} group={group.charts} jacketOrder={jacketOrder} />)}</div> : <div className="border border-dashed border-line px-6 py-20 text-center text-sm text-neutral-600">該当する譜面はありません。</div>}
    </div>
  );
}