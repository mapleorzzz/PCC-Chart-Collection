"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { defaultBossAppearance, defaultBossAppearanceSettings, normalizeBossAppearanceSettings, formatLevel, getSongGroupKey, type BossAppearance, type BossAppearanceSettings, type Chart, type Project } from "@/lib/data";

type ScheduledChart = { id: string; chart: Chart; status: "scheduled" | "draft"; scheduledAt?: string };
type Dataset = { charts: Chart[]; projects: Project[]; scheduledCharts: ScheduledChart[]; jacketOrder: Record<string, string[]>; bossAppearance: BossAppearanceSettings };
const emptyChart: Chart = {
  id: "", title: "", artist: "", charter: "", charterSearch: [], difficulty: "IN", isBoss: false,
  level: "", projectIds: [], publishedAt: new Date().toISOString().slice(0, 10)
};
const emptyProject: Project = {
  id: "", name: "", description: "", year: new Date().getFullYear()
};

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<Dataset>({ charts: [], projects: [], scheduledCharts: [], jacketOrder: {}, bossAppearance: defaultBossAppearanceSettings });
  const [selectedBossGroup, setSelectedBossGroup] = useState("__default__");
  type AdminTab = "charts" | "jackets" | "bossAppearance" | "projects" | "scheduled";
  const [tab, setTab] = useState<AdminTab>("charts");
  const [chart, setChart] = useState<Chart>(emptyChart);
  const [charterSearchText, setCharterSearchText] = useState("");
  const [project, setProject] = useState<Project>(emptyProject);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chartImageFile, setChartImageFile] = useState<File | null>(null);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageTarget, setImageTarget] = useState<"chart" | "project">("chart");
  const [publicationMode, setPublicationMode] = useState<"now" | "scheduled" | "draft">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [chartSearch, setChartSearch] = useState("");
  const [chartDifficultyFilter, setChartDifficultyFilter] = useState("all");
  const [chartSort, setChartSort] = useState<"newest" | "oldest" | "title">("newest");
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedScheduledId, setSelectedScheduledId] = useState("");
  const [draggedJacket, setDraggedJacket] = useState<{ groupKey: string; index: number } | null>(null);

  function clearSelectedUploads() {
    setSelectedFile(null);
    setChartImageFile(null);
    setProjectImageFile(null);
    const ids = ["chart-pez-file", "chart-image-file", "project-image-file"];
    ids.forEach((id) => {
      const input = document.getElementById(id) as HTMLInputElement | null;
      if (input) input.value = "";
    });
  }

  async function loadData() {
    const response = await fetch("/api/admin/data");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "データを読み込めませんでした。");
    setData({ ...result, jacketOrder: result.jacketOrder || {}, bossAppearance: normalizeBossAppearanceSettings(result.bossAppearance) });
    setLoggedIn(true);
  }

  useEffect(() => {
    loadData().catch(() => setLoggedIn(false));
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ログインできませんでした。");
      await loadData();
      setPassword("");
    } catch (e) { setError(e instanceof Error ? e.message : "ログインに失敗しました。"); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setData({ charts: [], projects: [], scheduledCharts: [], jacketOrder: {}, bossAppearance: defaultBossAppearanceSettings });
  }

  async function save(kind: "charts" | "projects" | "scheduled", next: Chart[] | Project[] | ScheduledChart[]) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/data", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data: next })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存できませんでした。");
      setData((current) => ({ ...current, [kind === "scheduled" ? "scheduledCharts" : kind]: next } as Dataset));
      setEditingId("");
      setChart(emptyChart);
      setCharterSearchText("");
      setProject(emptyProject);
      clearSelectedUploads();
    } catch (e) { setError(e instanceof Error ? e.message : "保存に失敗しました。"); }
    finally { setBusy(false); }
  }

  async function saveJacketOrder(next: Record<string, string[]>) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/data", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "jacketOrder", data: next })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ジャケット順を保存できませんでした。");
      setData((current) => ({ ...current, jacketOrder: next }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "ジャケット順の保存に失敗しました。");
    } finally { setBusy(false); }
  }

  async function saveBossAppearance(next: BossAppearanceSettings) {
    const appearances = [next.default, ...Object.values(next.songs)];
    if (appearances.some((item) => !/^#[0-9a-fA-F]{6}$/.test(item.labelColor) || !/^#[0-9a-fA-F]{6}$/.test(item.frameColor) || typeof item.labelText !== "string" || item.labelText.length > 60)) {
      setError("色は #RRGGBB 形式、表示文字は60文字以内で入力してください。"); return;
    }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "bossAppearance", data: next }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "BOSS画面設定を保存できませんでした。");
      setData((current) => ({ ...current, bossAppearance: next }));
    } catch (e) { setError(e instanceof Error ? e.message : "BOSS画面設定の保存に失敗しました。"); }
    finally { setBusy(false); }
  }

  function updateSelectedBossAppearance(patch: Partial<BossAppearance>) {
    setData((current) => {
      const base = selectedBossGroup === "__default__" ? current.bossAppearance.default : current.bossAppearance.songs[selectedBossGroup] || current.bossAppearance.default;
      const updated = { ...base, ...patch };
      return selectedBossGroup === "__default__"
        ? { ...current, bossAppearance: { ...current.bossAppearance, default: updated } }
        : { ...current, bossAppearance: { ...current.bossAppearance, songs: { ...current.bossAppearance.songs, [selectedBossGroup]: updated } } };
    });
  }

  function resetSelectedBossAppearance() {
    if (selectedBossGroup === "__default__") {
      setData((current) => ({ ...current, bossAppearance: { ...current.bossAppearance, default: defaultBossAppearance } }));
      return;
    }
    setData((current) => {
      const songs = { ...current.bossAppearance.songs }; delete songs[selectedBossGroup];
      return { ...current, bossAppearance: { ...current.bossAppearance, songs } };
    });
  }

  function moveJacket(groupKey: string, images: string[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setData((current) => ({ ...current, jacketOrder: { ...current.jacketOrder, [groupKey]: next } }));
  }

  async function uploadChartFile(fileToUpload?: File) {
    const file = fileToUpload || selectedFile;
    if (!file) { setError(".pezファイルを選択してください。"); return; }
    setUploading(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "アップロードに失敗しました。");
      setChart((current) => ({ ...current, fileUrl: result.browserDownloadUrl }));
      setSelectedFile(null);
      const picker = document.getElementById("chart-pez-file") as HTMLInputElement | null;
      if (picker) picker.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました。");
    } finally {
      setUploading(false);
    }
  }

  async function uploadImage(target: "chart" | "project", selectedFile?: File) {
    const file = selectedFile || (target === "chart" ? chartImageFile : projectImageFile);
    setImageTarget(target);
    if (!file) {
      setError("先に画像ファイルを選択してください。");
      return;
    }
    setImageUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/upload-image", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "画像アップロードに失敗しました。");
      if (typeof result.imageUrl !== "string" || !result.imageUrl) {
        throw new Error("アップロードは完了しましたが、画像URLを受け取れませんでした。");
      }
      if (target === "chart") {
        setChart((current) => ({ ...current, jacket: result.imageUrl }));
        setChartImageFile(null);
        const picker = document.getElementById("chart-image-file") as HTMLInputElement | null;
        if (picker) picker.value = "";
      } else {
        setProject((current) => ({ ...current, cover: result.imageUrl }));
        setProjectImageFile(null);
        const picker = document.getElementById("project-image-file") as HTMLInputElement | null;
        if (picker) picker.value = "";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "画像アップロードに失敗しました。");
    } finally {
      setImageUploading(false);
    }
  }

  function submitChart(event: FormEvent) {
    event.preventDefault();
    if (!editingId && publicationMode !== "now") {
      if (publicationMode === "scheduled" && !scheduledAt) {
        setError("公開日時を指定してください。");
        return;
      }
      const item: ScheduledChart = {
        id: chart.id, chart, status: publicationMode,
        ...(publicationMode === "scheduled" ? { scheduledAt: new Date(scheduledAt + ":00+09:00").toISOString() } : {})
      };
      if (data.charts.some((item) => item.id === chart.id) || data.scheduledCharts.some((item) => item.id === chart.id)) {
        setError("このIDは既に使用されています。"); return;
      }
      void save("scheduled", [...data.scheduledCharts, item]); return;
    }
    const next = editingId ? data.charts.map((item) => item.id === editingId ? chart : item) : [...data.charts, chart];
    void save("charts", next.map((item) => item.id === chart.id ? { ...item, charterSearch: charterSearchText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) } : item));
  }

  async function publishScheduled(item: ScheduledChart) {
    if (!window.confirm(`「${item.chart.title}」を今すぐ公開しますか？`)) return;
    await save("charts", [...data.charts.filter((chart) => chart.id !== item.chart.id), item.chart]);
    await save("scheduled", data.scheduledCharts.filter((entry) => entry.id !== item.id));
  }

  async function reschedule(item: ScheduledChart) {
    const current = item.scheduledAt
      ? new Date(new Date(item.scheduledAt).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16)
      : "";
    const value = window.prompt("新しい公開日時を日本時間で入力してください（例: 2026-12-01T18:30）", current);
    if (!value) return;
    const timestamp = Date.parse(value + ":00+09:00");
    if (!Number.isFinite(timestamp) || timestamp <= Date.now()) {
      setError("未来の日時を正しい形式で入力してください。");
      return;
    }
    const updated: ScheduledChart[] = data.scheduledCharts.map((entry): ScheduledChart =>
      entry.id === item.id
        ? { ...entry, scheduledAt: new Date(timestamp).toISOString(), status: "scheduled" }
        : entry
    );
    await save("scheduled", updated);
  }

  async function removeScheduled(id: string) {
    if (!window.confirm("この下書き・予約投稿を削除しますか？")) return;
    await save("scheduled", data.scheduledCharts.filter((item) => item.id !== id));
  }

  function submitProject(event: FormEvent) {
    event.preventDefault();
    const next = editingId
      ? data.projects.map((item) => item.id === editingId ? project : item)
      : [...data.projects, project];
    void save("projects", next);
  }

  function editChart(item: Chart) {
    clearSelectedUploads();
    setEditingId(item.id);
    setChart({ ...item });
    setCharterSearchText((item.charterSearch || []).join("\n"));
    setProject(emptyProject);
    setTab("charts");
  }
  function editProject(item: Project) {
    clearSelectedUploads();
    setEditingId(item.id);
    setProject({ ...item });
    setChart(emptyChart);
    setTab("projects");
  }
  function cancelEdit() {
    clearSelectedUploads();
    setEditingId("");
    setChart(emptyChart);
    setCharterSearchText("");
    setProject(emptyProject);
  }

  async function removeChart(id: string) {
    if (!window.confirm("この譜面を削除しますか？")) return;
    await save("charts", data.charts.filter((item) => item.id !== id));
  }
  async function removeProject(id: string) {
    if (!window.confirm("この企画を削除しますか？譜面側の企画紐付けも解除されます。")) return;
    const charts = data.charts.map((item) => ({ ...item, projectIds: item.projectIds.filter((projectId) => projectId !== id) }));
    await save("charts", charts);
    await save("projects", data.projects.filter((item) => item.id !== id));
  }

  const field = "mt-1 w-full border border-line bg-[#111] px-3 py-2.5 text-sm text-white outline-none transition focus:border-neutral-500";
  const label = "block text-xs text-neutral-400";
  const jacketGroups = Array.from(data.charts.reduce((groups, item) => {
    const key = getSongGroupKey(item);
    groups.set(key, [...(groups.get(key) || []), item]);
    return groups;
  }, new Map<string, Chart[]>()).entries()).map(([key, charts]) => {
    const images = Array.from(new Set(charts.map((item) => item.jacket?.trim()).filter((src): src is string => Boolean(src))));
    const configured = data.jacketOrder[key] || [];
    return { key, charts, images: [...configured.filter((src) => images.includes(src)), ...images.filter((src) => !configured.includes(src))] };
  }).filter((group) => group.charts.length >= 2 && group.images.length > 0);
  const bossGroups = Array.from(data.charts.reduce((groups, item) => {
    const key = getSongGroupKey(item); groups.set(key, [...(groups.get(key) || []), item]); return groups;
  }, new Map<string, Chart[]>()).entries()).map(([key, charts]) => ({ key, charts })).filter((group) => group.charts.some((item) => item.isBoss));
  const selectedBossAppearance = selectedBossGroup === "__default__" ? data.bossAppearance.default : data.bossAppearance.songs[selectedBossGroup] || data.bossAppearance.default;
  const filteredCharts = data.charts
    .filter((item) => {
      const q = chartSearch.trim().toLowerCase();
      const matchesSearch = !q || [item.title, item.artist, item.charter, item.id, ...(item.charterSearch || [])].some((value) => value.toLowerCase().includes(q));
      return matchesSearch && (chartDifficultyFilter === "all" || item.difficulty === chartDifficultyFilter);
    })
    .sort((a, b) => chartSort === "title"
      ? a.title.localeCompare(b.title, "ja")
      : chartSort === "newest"
        ? b.publishedAt.localeCompare(a.publishedAt)
        : a.publishedAt.localeCompare(b.publishedAt));
  const filteredProjects = data.projects.filter((item) =>
    [item.name, item.organizer || "", item.id].some((value) => value.toLowerCase().includes(projectSearch.trim().toLowerCase()))
  );
  const selectedScheduled = data.scheduledCharts.find((item) => item.id === selectedScheduledId) || data.scheduledCharts[0] || null;

  if (!loggedIn) return (
    <div className="mx-auto max-w-md px-5 py-24">
      <p className="text-[10px] tracking-[0.3em] text-neutral-600">RESTRICTED AREA</p>
      <h1 className="mt-3 text-3xl font-light sm:text-4xl">Admin Login</h1>
      <form onSubmit={login} className="mt-8 space-y-4">
        <label className={label}>管理者パスワード<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} required /></label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={busy} className="w-full bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-50">{busy ? "確認中..." : "ログイン"}</button>
      </form>
      <p className="mt-5 text-xs leading-6 text-neutral-600">管理者専用ページです。パスワードはサイト上には保存されません。</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-14">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-[10px] tracking-[0.3em] text-neutral-600">MANAGEMENT</p><h1 className="mt-3 text-4xl font-light">Admin Dashboard</h1><p className="mt-2 text-sm text-neutral-500">GitHubのデータを直接更新します。</p></div>
        <button onClick={logout} className="border border-line px-4 py-2 text-xs text-neutral-400 hover:border-white hover:text-white">ログアウト</button>
      </div>
      {error && <p role="alert" className="mt-6 border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "公開中の譜面", value: data.charts.length },
          { label: "企画", value: data.projects.length },
          { label: "予約・下書き", value: data.scheduledCharts.length }
        ].map((item) => <div key={item.label} className="border border-line bg-[#0d0d0d] p-4"><p className="text-[10px] tracking-wider text-neutral-500">{item.label}</p><p className="mt-2 text-2xl font-light tabular-nums">{item.value}</p></div>)}
      </div>
      <div className="mt-8 flex gap-2 overflow-x-auto border-b border-line">
        <button onClick={() => { setTab("charts"); cancelEdit(); }} className={`px-4 py-3 text-xs ${tab === "charts" ? "border-b border-white text-white" : "text-neutral-500"}`}>譜面管理 ({data.charts.length})</button>
        <button onClick={() => { setTab("jackets"); cancelEdit(); }} className={`px-4 py-3 text-xs ${tab === "jackets" ? "border-b border-white text-white" : "text-neutral-500"}`}>ジャケット管理</button>
        <button onClick={() => { setTab("bossAppearance"); cancelEdit(); }} className={`px-4 py-3 text-xs ${tab === "bossAppearance" ? "border-b border-white text-white" : "text-neutral-500"}`}>BOSS画面設定</button>
        <button onClick={() => { setTab("projects"); cancelEdit(); }} className={`px-4 py-3 text-xs ${tab === "projects" ? "border-b border-white text-white" : "text-neutral-500"}`}>企画管理 ({data.projects.length})</button>
        <button onClick={() => { setTab("scheduled"); cancelEdit(); }} className={`px-4 py-3 text-xs ${tab === "scheduled" ? "border-b border-white text-white" : "text-neutral-500"}`}>予約・下書き ({data.scheduledCharts.length})</button>
      </div>

      {tab === "charts" ? <>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.7fr)]">
          <div className="min-w-0 lg:sticky lg:top-6">
        <section className="mt-10">
          <div className="mb-4 flex min-w-0 flex-col items-stretch gap-3">
            <div className="min-w-0"><h2 className="text-lg">登録済み譜面</h2><p className="mt-1 text-xs text-neutral-600">{filteredCharts.length} / {data.charts.length} 件表示</p></div>
            <div className="grid min-w-0 grid-cols-1 gap-2">
              <input aria-label="譜面を検索" className={field + " w-full min-w-0"} value={chartSearch} onChange={(e) => setChartSearch(e.target.value)} placeholder="曲名・アーティスト・Charter..." />
              <select aria-label="難易度で絞り込み" className={field + " w-full min-w-0"} value={chartDifficultyFilter} onChange={(e) => setChartDifficultyFilter(e.target.value)}><option value="all">全難易度</option>{["EZ","HD","IN","AT","Other"].map((d) => <option key={d} value={d}>{d}</option>)}</select>
              <select aria-label="並び替え" className={field + " w-full min-w-0"} value={chartSort} onChange={(e) => setChartSort(e.target.value as "newest" | "oldest" | "title")}><option value="newest">新しい順</option><option value="oldest">古い順</option><option value="title">曲名順</option></select>
            </div>
          </div>
          <div className="divide-y divide-line border-y border-line">{filteredCharts.map((item) => <div key={item.id} className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center sm:gap-4"><div className="flex min-w-0 items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden border border-line bg-[#171717]">{item.jacket ? <img src={item.jacket} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[8px] text-neutral-700">NO IMG</div>}</div><div className="min-w-0"><p className="truncate text-sm">{item.title}</p><p className="mt-1 truncate text-xs text-neutral-500">{item.artist} · {item.charter}</p><p className="mt-1 text-[10px] text-neutral-600">{item.difficulty} {formatLevel(item.level)} · {item.fileUrl ? "PEZあり" : "PEZなし"} · {item.youtubeUrl ? "動画あり" : "動画なし"}</p></div></div><div className="flex min-h-10 shrink-0 items-center gap-5"><button onClick={() => editChart(item)} className="text-xs text-neutral-300 hover:text-white">編集</button><button onClick={() => removeChart(item.id)} className="text-xs text-red-400 hover:text-red-300">削除</button></div></div>)}{!filteredCharts.length && <p className="py-10 text-center text-sm text-neutral-600">{data.charts.length ? "条件に一致する譜面がありません。" : "譜面はまだ登録されていません。"}</p>}</div>
        </section>
          </div>
          <div className="min-w-0">
        <section className="mt-6 border border-line p-4 sm:mt-8 sm:p-7">
          <h2 className="text-lg">{editingId ? "譜面を編集" : "譜面を新規登録"}</h2>
          <form onSubmit={submitChart} className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><p className="border-b border-line pb-2 text-[10px] tracking-[0.2em] text-neutral-500">01 / BASIC INFORMATION</p></div>
            <label className={label}>ID（英数字・ハイフン）<input className={field} value={chart.id} disabled={!!editingId} onChange={(e) => setChart({ ...chart, id: e.target.value })} required /></label>
            <label className={label}>曲名<input className={field} value={chart.title} onChange={(e) => setChart({ ...chart, title: e.target.value })} required /></label>
            <label className={label}>楽曲グループID（同じ楽曲の譜面で共通）<input className={field} value={chart.songId || ""} onChange={(e) => setChart({ ...chart, songId: e.target.value.trim() || undefined })} placeholder="グループ化する譜面に同じIDを入力" /></label>
            <label className="flex items-start gap-3 border border-amber-700/40 bg-amber-950/10 p-3 text-xs text-neutral-300 sm:col-span-2"><input type="checkbox" checked={!!chart.isBoss} onChange={(e) => setChart({ ...chart, isBoss: e.target.checked })} className="mt-0.5 accent-amber-400" /><span><span className="block font-medium tracking-wider text-amber-300">BOSS CHART</span><span className="mt-1 block leading-5 text-neutral-500">この楽曲をBOSS専用詳細画面にします。同じ楽曲グループIDの譜面は、どの難易度から開いても専用画面にまとまります。グループ内のいずれか1譜面でONにしてください。</span></span></label>
            <label className={label}>アーティスト<input className={field} value={chart.artist} onChange={(e) => setChart({ ...chart, artist: e.target.value })} required /></label>
            <label className={label}>表示用製作者名義（サイトに表示）<input className={field} value={chart.charter} onChange={(e) => setChart({ ...chart, charter: e.target.value })} required /></label>
            <label className={label + " sm:col-span-2"}>検索用製作者名義（非公開・複数可）<textarea className={field + " min-h-32 resize-y leading-6"} rows={5} value={charterSearchText} onChange={(e) => setCharterSearchText(e.target.value)} placeholder={"1行に1名義ずつ入力\n例: maple._.zz\nChaos"} /><span className="mt-1 block text-[10px] text-neutral-600">ここに入力した名義はサイト上に表示されず、製作者検索にだけ使用されます。</span></label>
            <label className={label}>難易度<select className={field} value={chart.difficulty} onChange={(e) => setChart({ ...chart, difficulty: e.target.value as Chart["difficulty"] })}>{["EZ","HD","IN","AT","Other"].map((d) => <option key={d}>{d}</option>)}</select></label>
            <label className={label}>レベル<input className={field} value={chart.level} onChange={(e) => setChart({ ...chart, level: e.target.value })} placeholder="例: 15" required /></label>
            <div className="sm:col-span-2"><p className="border-b border-line pb-2 text-[10px] tracking-[0.2em] text-neutral-500">02 / ASSETS & MEDIA</p></div>
            <div className={label}>
              ジャケット画像
              <input className={field} value={chart.jacket || ""} onChange={(e) => setChart({ ...chart, jacket: e.target.value })} placeholder="画像URL（アップロード後に自動入力）" />
              {chart.jacket && <div className="mt-2 flex items-center gap-3"><img src={chart.jacket} alt="ジャケットプレビュー" className="h-14 w-14 border border-line object-cover" /><span className="text-[10px] text-emerald-400">画像URL設定済み</span></div>}
              <input id="chart-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={field} disabled={imageUploading} onChange={(e) => { const file = e.target.files?.[0] || null; setChartImageFile(file); if (file) void uploadImage("chart", file); }} />
              {imageUploading && imageTarget === "chart" && <p className="mt-2 text-xs text-neutral-400">画像をアップロード中...</p>}
              {chartImageFile && !imageUploading && <p className="mt-2 text-xs text-neutral-400">{chartImageFile.name} · {(chartImageFile.size / 1024 / 1024).toFixed(2)} MB</p>}
              <p className="mt-2 text-xs text-neutral-600">JPEG・PNG・WebP・GIF / 4 MB以下。選択すると自動アップロードされます。</p>
            </div>
            <div className={label}>
              .pezファイル
              <input id="chart-pez-file" type="file" accept=".pez,application/octet-stream" className={field} disabled={uploading} onChange={(e) => { const file = e.target.files?.[0] || null; setSelectedFile(file); if (file) void uploadChartFile(file); }} />
              {uploading && <p className="mt-2 text-xs text-neutral-400">GitHub Releaseにアップロード中...</p>}
              {selectedFile && !uploading && <p className="mt-2 text-xs text-neutral-500">{selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>}
              <p className="mt-2 text-xs text-neutral-600">選択するとGitHub Releaseに自動アップロードされます。</p>
              {chart.fileUrl ? <p className="mt-2 text-[10px] text-emerald-400">✓ PEZダウンロードURL設定済み</p> : <p className="mt-2 text-[10px] text-amber-500">! PEZ未登録</p>}
            </div>
            <label className={label}>.pez ダウンロードURL<input type="url" className={field} value={chart.fileUrl || ""} onChange={(e) => setChart({ ...chart, fileUrl: e.target.value })} placeholder="https://example.com/chart.pez" /></label>
            <div className="sm:col-span-2"><p className="border-b border-line pb-2 text-[10px] tracking-[0.2em] text-neutral-500">03 / VIDEO & DETAILS</p></div>
            <label className={label}>YouTubeリンク<input type="url" className={field} value={chart.youtubeUrl || ""} onChange={(e) => setChart({ ...chart, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />{chart.youtubeUrl ? <span className="mt-1 block text-[10px] text-emerald-400">動画リンク設定済み</span> : <span className="mt-1 block text-[10px] text-neutral-600">未設定（後から追加できます）</span>}</label>
            <label className={label}>登録日<input type="date" className={field} value={chart.publishedAt} onChange={(e) => setChart({ ...chart, publishedAt: e.target.value })} required /></label>
            <label className={label}>関連企画（複数選択可）<select multiple className={field + " min-h-32"} value={chart.projectIds} onChange={(e) => setChart({ ...chart, projectIds: Array.from(e.target.selectedOptions, (option) => option.value) })}>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label className={label + " sm:col-span-2"}>説明<textarea className={field + " min-h-24"} value={chart.description || ""} onChange={(e) => setChart({ ...chart, description: e.target.value })} /></label>
            {!editingId && <div className="grid gap-4 border-t border-line pt-4 sm:col-span-2 sm:grid-cols-2"><p className="text-[10px] tracking-[0.2em] text-neutral-500 sm:col-span-2">04 / PUBLISHING</p>
              <label className={label}>公開方法<select className={field} value={publicationMode} onChange={(e) => setPublicationMode(e.target.value as "now" | "scheduled" | "draft")}><option value="now">今すぐ公開</option><option value="scheduled">日時を指定して予約公開</option><option value="draft">下書き保存（非公開）</option></select></label>
              {publicationMode === "scheduled" && <label className={label}>公開日時（日本時間）<input type="datetime-local" className={field} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></label>}
              <p className="text-xs leading-6 text-neutral-500 sm:col-span-2">予約投稿は約5分間隔で公開処理されます。下書きは公開されません。</p>
            </div>}
            <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="bg-white px-5 py-3 text-xs font-medium text-black disabled:opacity-50">{busy ? "保存中..." : editingId ? "変更を保存" : publicationMode === "now" ? "譜面を登録・公開" : publicationMode === "scheduled" ? "予約投稿を保存" : "下書き保存"}</button>{editingId && <button type="button" onClick={cancelEdit} className="border border-line px-5 py-3 text-xs text-neutral-300">キャンセル</button>}</div>
          </form>
        </section>
          </div>
        </div>
            </> : tab === "jackets" ? <>
        <section className="mt-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-lg">楽曲グループ別ジャケット順</h2><p className="mt-1 text-xs text-neutral-500">2譜面以上ある楽曲のみ表示。画像をドラッグ＆ドロップして順番を変更できます。</p></div>
            <button type="button" disabled={busy} onClick={() => void saveJacketOrder(data.jacketOrder)} className="bg-white px-5 py-3 text-xs font-medium text-black disabled:opacity-50">{busy ? "保存中..." : "ジャケット順を保存"}</button>
          </div>
          <div className="space-y-5">
            {jacketGroups.map((group) => <section key={group.key} className="border border-line p-4 sm:p-5">
              <div className="mb-4"><h3 className="text-sm">{group.charts[0].title}</h3><p className="mt-1 text-[10px] text-neutral-600">{group.charts.length}譜面 · {group.images.length}ジャケット</p></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.images.map((src, index) => <div key={src} draggable onDragStart={() => setDraggedJacket({ groupKey: group.key, index })} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (!draggedJacket || draggedJacket.groupKey !== group.key) return; const next = [...group.images]; const moved = next.splice(draggedJacket.index, 1)[0]; next.splice(index, 0, moved); setData((current) => ({ ...current, jacketOrder: { ...current.jacketOrder, [group.key]: next } })); setDraggedJacket(null); }} onDragEnd={() => setDraggedJacket(null)} className={"flex min-w-0 cursor-grab items-center gap-3 border bg-[#111] p-2 active:cursor-grabbing " + (draggedJacket?.groupKey === group.key && draggedJacket.index === index ? "border-white opacity-50" : "border-line")}>
                  <span className="select-none text-xl text-neutral-600" aria-hidden="true">⠿</span>
                  <img src={src} alt="" draggable={false} className="h-16 w-16 shrink-0 object-cover" />
                  <div className="min-w-0 flex-1"><p className="text-xs">表示順</p><p className="mt-1 truncate text-[10px] text-neutral-600">{group.charts.filter((item) => item.jacket?.trim() === src).map((item) => item.difficulty).join(" / ")}</p></div>
                  <label className="flex shrink-0 items-center gap-1 text-[10px] text-neutral-500">順番<select aria-label="表示順" value={index + 1} onChange={(event) => { const target = Number(event.target.value) - 1; if (target === index) return; const next = [...group.images]; const moved = next.splice(index, 1)[0]; next.splice(target, 0, moved); setData((current) => ({ ...current, jacketOrder: { ...current.jacketOrder, [group.key]: next } })); }} className="border border-line bg-[#111] px-2 py-2 text-sm text-white">{group.images.map((_, position) => <option key={position} value={position + 1}>{position + 1}</option>)}</select></label>
                </div>)}
              </div>
            </section>)}
            {!jacketGroups.length && <p className="border border-dashed border-line py-12 text-center text-sm text-neutral-600">2譜面以上ある楽曲グループはありません。</p>}
          </div>
        </section>
      </> : tab === "bossAppearance" ? <>
        <section className="mt-6 max-w-3xl">
          <div className="mb-5">
            <h2 className="text-lg">BOSS専用ページのデザイン</h2>
            <p className="mt-1 text-xs leading-6 text-neutral-500">共通設定をベースに、楽曲ごとに表示文字・文字色・ジャケット枠色を個別設定できます。個別設定がない楽曲は共通設定を使用します。</p>
          </div>
          <label className={label + " mb-5 block max-w-xl"}>設定する楽曲
            <select className={field} value={selectedBossGroup} onChange={(e) => setSelectedBossGroup(e.target.value)}>
              <option value="__default__">共通設定（個別設定がない楽曲に適用）</option>
              {bossGroups.map((group) => <option key={group.key} value={group.key}>{group.charts[0].title} — {group.charts[0].artist}</option>)}
            </select>
          </label>
          {selectedBossGroup !== "__default__" && <p className="mb-4 text-[10px] text-neutral-500">{data.bossAppearance.songs[selectedBossGroup] ? "この楽曲には個別設定があります。" : "現在は共通設定を使用中です。変更して保存すると、この楽曲専用の設定になります。"}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="border border-line bg-[#0d0d0d] p-4">
              <span className="block text-xs text-neutral-300">表示する文字</span>
              <input aria-label="アーカイブ表示文字" value={selectedBossAppearance.labelText} onChange={(e) => updateSelectedBossAppearance({ labelText: e.target.value })} className={field + " mt-3"} maxLength={60} placeholder="PCC · SPECIAL ARCHIVE" />
              <p className="mt-2 text-[9px] tracking-[0.2em] text-neutral-500">プレビュー：<span style={{ color: selectedBossAppearance.labelColor }}>{data.bossAppearance.labelText || "PCC · SPECIAL ARCHIVE"}</span></p>
              <span className="mt-4 block text-xs text-neutral-300">文字色</span>
              <div className="mt-3 flex items-center gap-3">
                <input aria-label="アーカイブ文字色" type="color" value={selectedBossAppearance.labelColor} onChange={(e) => updateSelectedBossAppearance({ labelColor: e.target.value })} className="h-11 w-14 cursor-pointer border border-line bg-transparent p-1" />
                <input aria-label="アーカイブ文字色 HEX" value={data.bossAppearance.labelColor} onChange={(e) => setData((current) => ({ ...current, bossAppearance: { ...current.bossAppearance, labelColor: e.target.value } }))} className={field + " mt-0 font-mono uppercase"} maxLength={7} pattern="^#[0-9a-fA-F]{6}$" />
              </div>
              <p className="mt-3 text-[9px] tracking-[0.35em]" style={{ color: data.bossAppearance.labelColor }}>{data.bossAppearance.labelText || "PCC · SPECIAL ARCHIVE"}</p>
            </label>
            <label className="border border-line bg-[#0d0d0d] p-4">
              <span className="block text-xs text-neutral-300">ジャケットの枠・装飾色</span>
              <div className="mt-3 flex items-center gap-3">
                <input aria-label="ジャケット枠色" type="color" value={selectedBossAppearance.frameColor} onChange={(e) => updateSelectedBossAppearance({ frameColor: e.target.value })} className="h-11 w-14 cursor-pointer border border-line bg-transparent p-1" />
                <input aria-label="ジャケット枠色 HEX" value={data.bossAppearance.frameColor} onChange={(e) => setData((current) => ({ ...current, bossAppearance: { ...current.bossAppearance, frameColor: e.target.value } }))} className={field + " mt-0 font-mono uppercase"} maxLength={7} pattern="^#[0-9a-fA-F]{6}$" />
              </div>
              <div className="mt-3 flex justify-center py-2">
                <div className="border p-2" style={{ borderColor: data.bossAppearance.frameColor }}>
                  <div className="h-16 w-16 border-2 bg-[#171717]" style={{ borderColor: data.bossAppearance.frameColor }} />
                </div>
              </div>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy} onClick={() => void saveBossAppearance(data.bossAppearance)} className="bg-white px-5 py-3 text-xs font-medium text-black disabled:opacity-50">{busy ? "保存中..." : "BOSS画面設定を保存"}</button>
            <button type="button" disabled={busy} onClick={resetSelectedBossAppearance} className="border border-line px-4 py-3 text-xs text-neutral-300 disabled:opacity-50">{selectedBossGroup === "__default__" ? "初期設定に戻す" : "共通設定に戻す"}</button>
            <p className="text-[10px] text-neutral-600">変更は保存ボタンを押すと反映されます。</p>
          </div>
        </section>
      </> : tab === "projects" ? <>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.7fr)]">
          <section className="min-w-0 lg:sticky lg:top-6">
            <div className="mb-4"><h2 className="text-lg">登録済み企画</h2><p className="mt-1 text-xs text-neutral-600">{filteredProjects.length} / {data.projects.length} 件表示</p></div>
            <input aria-label="企画を検索" className={field + " w-full"} value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} placeholder="企画名・主催者で検索..." />
            <div className="mt-4 divide-y divide-line border-y border-line">
              {filteredProjects.map((item) => <div key={item.id} className="flex items-center gap-3 py-4">
                {item.cover ? <img src={item.cover} alt="" className="h-12 w-16 shrink-0 border border-line object-cover" /> : <div className="flex h-12 w-16 shrink-0 items-center justify-center border border-line text-[8px] text-neutral-700">NO COVER</div>}
                <div className="min-w-0 flex-1"><p className="truncate text-sm">{item.name}</p><p className="mt-1 truncate text-xs text-neutral-600">{item.year} · {item.organizer || "主催者未設定"}</p></div>
                <div className="flex shrink-0 gap-3"><button onClick={() => editProject(item)} className="text-xs text-neutral-300 hover:text-white">編集</button><button onClick={() => removeProject(item.id)} className="text-xs text-red-400 hover:text-red-300">削除</button></div>
              </div>)}
              {!filteredProjects.length && <p className="py-10 text-center text-sm text-neutral-600">{data.projects.length ? "条件に一致する企画がありません。" : "企画はまだ登録されていません。"}</p>}
            </div>
          </section>
          <section className="min-w-0 border border-line p-4 sm:p-7">
            <h2 className="text-lg">{editingId ? "企画を編集" : "企画を新規登録"}</h2>
            <form onSubmit={submitProject} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={label}>ID（英数字・ハイフン）<input className={field} value={project.id} disabled={!!editingId} onChange={(e) => setProject({ ...project, id: e.target.value })} required /></label>
              <label className={label}>企画名<input className={field} value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} required /></label>
              <label className={label}>開催年<input type="number" className={field} value={project.year} onChange={(e) => setProject({ ...project, year: Number(e.target.value) })} required /></label>
              <label className={label}>主催者<input className={field} value={project.organizer || ""} onChange={(e) => setProject({ ...project, organizer: e.target.value })} /></label>
              <label className={label}>開始日<input type="date" className={field} value={project.startDate || ""} onChange={(e) => setProject({ ...project, startDate: e.target.value })} /></label>
              <label className={label}>終了日<input type="date" className={field} value={project.endDate || ""} onChange={(e) => setProject({ ...project, endDate: e.target.value })} /></label>
              <div className={label + " sm:col-span-2"}>
                企画カバー画像
                <input className={field} value={project.cover || ""} onChange={(e) => setProject({ ...project, cover: e.target.value })} placeholder="画像URL（アップロード後に自動入力）" />
                {project.cover && <div className="mt-2 flex items-center gap-3"><img src={project.cover} alt="企画カバーのプレビュー" className="h-14 w-24 border border-line object-cover" /><span className="text-[10px] text-emerald-400">画像URL設定済み</span></div>}
                <input id="project-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={field} disabled={imageUploading} onChange={(e) => { const file = e.target.files?.[0] || null; setProjectImageFile(file); if (file) void uploadImage("project", file); }} />
                {imageUploading && imageTarget === "project" && <p className="mt-2 text-xs text-neutral-400">画像をアップロード中...</p>}
                {projectImageFile && !imageUploading && <p className="mt-2 text-xs text-neutral-400">{projectImageFile.name} · {(projectImageFile.size / 1024 / 1024).toFixed(2)} MB</p>}
                <p className="mt-2 text-xs text-neutral-600">JPEG・PNG・WebP・GIF / 4 MB以下。選択すると自動アップロードされます。</p>
              </div>
              <label className={label + " sm:col-span-2"}>企画概要<textarea className={field + " min-h-32"} value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} required /></label>
              <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="bg-white px-5 py-3 text-xs font-medium text-black disabled:opacity-50">{busy ? "保存中..." : editingId ? "変更を保存" : "企画を登録"}</button>{editingId && <button type="button" onClick={cancelEdit} className="border border-line px-5 py-3 text-xs text-neutral-300">キャンセル</button>}</div>
            </form>
          </section>
        </div>
      </> : <>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.7fr)]">
          <section className="min-w-0 lg:sticky lg:top-6">
            <div className="mb-4"><h2 className="text-lg">予約・下書き</h2><p className="mt-1 text-xs text-neutral-600">{data.scheduledCharts.length} 件 · 公開予約と非公開下書き</p></div>
            <div className="divide-y divide-line border-y border-line">
              {data.scheduledCharts.map((item) => <button type="button" key={item.id} onClick={() => setSelectedScheduledId(item.id)} className={`flex w-full items-center gap-3 px-2 py-4 text-left transition hover:bg-white/5 ${selectedScheduledId === item.id ? "bg-white/5" : ""}`}>
                {item.chart.jacket ? <img src={item.chart.jacket} alt="" className="h-12 w-12 shrink-0 border border-line object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-line text-[8px] text-neutral-700">NO IMG</div>}
                <span className="min-w-0 flex-1"><span className="block truncate text-sm">{item.chart.title}</span><span className="mt-1 block truncate text-xs text-neutral-500">{item.status === "draft" ? "下書き・非公開" : "予約公開"}</span><span className="mt-1 block text-[10px] text-neutral-600">{item.chart.difficulty} {formatLevel(item.chart.level)}</span></span>
                <span className="text-neutral-600">›</span>
              </button>)}
              {!data.scheduledCharts.length && <p className="py-10 text-center text-sm text-neutral-600">予約・下書きはありません。</p>}
            </div>
          </section>
          <section className="min-w-0 border border-line p-4 sm:p-7">
            {selectedScheduled ? <>
              <div className="flex flex-col gap-4 sm:flex-row">
                {selectedScheduled.chart.jacket && <img src={selectedScheduled.chart.jacket} alt="" className="h-28 w-28 border border-line object-cover" />}
                <div className="min-w-0"><p className="text-[10px] tracking-[0.2em] text-neutral-500">SCHEDULED ITEM</p><h2 className="mt-2 text-xl">{selectedScheduled.chart.title}</h2><p className="mt-1 text-sm text-neutral-500">{selectedScheduled.chart.artist}</p><p className="mt-3 text-xs text-neutral-400">{selectedScheduled.status === "draft" ? "下書き・非公開" : "予約公開"}</p>{selectedScheduled.scheduledAt && <p className="mt-1 text-xs text-neutral-500">{new Date(selectedScheduled.scheduledAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}（JST）</p>}</div>
              </div>
              <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
                <div><p className="text-[10px] text-neutral-600">DIFFICULTY</p><p className="mt-1 text-sm">{selectedScheduled.chart.difficulty} {formatLevel(selectedScheduled.chart.level)}</p></div>
                <div><p className="text-[10px] text-neutral-600">CHARTER</p><p className="mt-1 text-sm">{selectedScheduled.chart.charter}</p></div>
                <div><p className="text-[10px] text-neutral-600">ID</p><p className="mt-1 text-sm">{selectedScheduled.chart.id}</p></div>
                <div><p className="text-[10px] text-neutral-600">PEZ</p><p className="mt-1 break-all text-sm">{selectedScheduled.chart.fileUrl ? "登録済み" : "未登録"}</p></div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
                {selectedScheduled.status === "scheduled" && <><button onClick={() => reschedule(selectedScheduled)} className="border border-line px-4 py-3 text-xs text-neutral-200 hover:border-white">日時変更</button><button onClick={() => publishScheduled(selectedScheduled)} className="bg-white px-4 py-3 text-xs text-black">今すぐ公開</button></>}
                <button onClick={() => removeScheduled(selectedScheduled.id)} className="border border-red-900 px-4 py-3 text-xs text-red-400 hover:border-red-500">削除</button>
              </div>
            </> : <div className="flex min-h-64 items-center justify-center text-center text-sm text-neutral-600">{data.scheduledCharts.length ? "左側から予約・下書きを選択してください。" : "予約・下書きはまだありません。"}</div>}
          </section>
        </div>
      </>}
    </div>
  );
}