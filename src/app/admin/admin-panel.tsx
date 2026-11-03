"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Chart, Project } from "@/lib/data";

type Dataset = { charts: Chart[]; projects: Project[] };
const emptyChart: Chart = {
  id: "", title: "", artist: "", charter: "", difficulty: "IN",
  level: "", projectIds: [], publishedAt: new Date().toISOString().slice(0, 10)
};
const emptyProject: Project = {
  id: "", name: "", description: "", year: new Date().getFullYear()
};

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<Dataset>({ charts: [], projects: [] });
  const [tab, setTab] = useState<"charts" | "projects">("charts");
  const [chart, setChart] = useState<Chart>(emptyChart);
  const [project, setProject] = useState<Project>(emptyProject);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);\n  const [selectedFile, setSelectedFile] = useState<File | null>(null);\n  const [uploading, setUploading] = useState(false);

  async function loadData() {
    const response = await fetch("/api/admin/data");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "データを読み込めませんでした。");
    setData(result);
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
    setData({ charts: [], projects: [] });
  }

  async function save(kind: "charts" | "projects", next: Chart[] | Project[]) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/data", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data: next })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存できませんでした。");
      setData((current) => ({ ...current, [kind]: next } as Dataset));
      setEditingId("");
      setChart(emptyChart);
      setProject(emptyProject);
    } catch (e) { setError(e instanceof Error ? e.message : "保存に失敗しました。"); }
    finally { setBusy(false); }
  }

  async function uploadChartFile() {
    if (!selectedFile) { setError(".pezファイルを選択してください。"); return; }
    setUploading(true); setError("");
    try {
      const form = new FormData();
      form.append("file", selectedFile);
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

  function submitChart(event: FormEvent) {
    event.preventDefault();
    const next = editingId
      ? data.charts.map((item) => item.id === editingId ? chart : item)
      : [...data.charts, chart];
    void save("charts", next);
  }

  function submitProject(event: FormEvent) {
    event.preventDefault();
    const next = editingId
      ? data.projects.map((item) => item.id === editingId ? project : item)
      : [...data.projects, project];
    void save("projects", next);
  }

  function editChart(item: Chart) { setEditingId(item.id); setChart({ ...item }); setTab("charts"); }
  function editProject(item: Project) { setEditingId(item.id); setProject({ ...item }); setTab("projects"); }
  function cancelEdit() { setEditingId(""); setChart(emptyChart); setProject(emptyProject); }

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

  const field = "mt-1 w-full border border-line bg-[#111] px-3 py-3 text-sm text-white outline-none focus:border-neutral-500";
  const label = "block text-xs text-neutral-500";

  if (!loggedIn) return (
    <div className="mx-auto max-w-md px-5 py-24">
      <p className="text-[10px] tracking-[0.3em] text-neutral-600">RESTRICTED AREA</p>
      <h1 className="mt-3 text-4xl font-light">Admin Login</h1>
      <form onSubmit={login} className="mt-8 space-y-4">
        <label className={label}>管理者パスワード<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} required /></label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={busy} className="w-full bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-50">{busy ? "確認中..." : "ログイン"}</button>
      </form>
      <p className="mt-5 text-xs leading-6 text-neutral-600">管理者専用ページです。パスワードはサイト上には保存されません。</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[10px] tracking-[0.3em] text-neutral-600">MANAGEMENT</p><h1 className="mt-3 text-4xl font-light">Admin Dashboard</h1><p className="mt-2 text-sm text-neutral-500">GitHubのデータを直接更新します。</p></div>
        <button onClick={logout} className="border border-line px-4 py-2 text-xs text-neutral-400 hover:border-white hover:text-white">ログアウト</button>
      </div>
      {error && <p className="mt-6 border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
      <div className="mt-10 flex gap-2 border-b border-line">
        <button onClick={() => { setTab("charts"); cancelEdit(); }} className={`px-4 py-3 text-xs ${tab === "charts" ? "border-b border-white text-white" : "text-neutral-500"}`}>譜面管理 ({data.charts.length})</button>
        <button onClick={() => { setTab("projects"); cancelEdit(); }} className={`px-4 py-3 text-xs ${tab === "projects" ? "border-b border-white text-white" : "text-neutral-500"}`}>企画管理 ({data.projects.length})</button>
      </div>

      {tab === "charts" ? <>
        <section className="mt-8 border border-line p-5 sm:p-7">
          <h2 className="text-lg">{editingId ? "譜面を編集" : "譜面を新規登録"}</h2>
          <form onSubmit={submitChart} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className={label}>ID（英数字・ハイフン）<input className={field} value={chart.id} disabled={!!editingId} onChange={(e) => setChart({ ...chart, id: e.target.value })} required /></label>
            <label className={label}>曲名<input className={field} value={chart.title} onChange={(e) => setChart({ ...chart, title: e.target.value })} required /></label>
            <label className={label}>アーティスト<input className={field} value={chart.artist} onChange={(e) => setChart({ ...chart, artist: e.target.value })} required /></label>
            <label className={label}>Charter<input className={field} value={chart.charter} onChange={(e) => setChart({ ...chart, charter: e.target.value })} required /></label>
            <label className={label}>難易度<select className={field} value={chart.difficulty} onChange={(e) => setChart({ ...chart, difficulty: e.target.value as Chart["difficulty"] })}>{["EZ","HD","IN","AT","Other"].map((d) => <option key={d}>{d}</option>)}</select></label>
            <label className={label}>レベル<input className={field} value={chart.level} onChange={(e) => setChart({ ...chart, level: e.target.value })} placeholder="例: 15" required /></label>
            <label className={label}>ジャケット画像URL<input className={field} value={chart.jacket || ""} onChange={(e) => setChart({ ...chart, jacket: e.target.value })} placeholder="https://..." /></label>
            <div className={label}>
              .pezファイル
              <input id="chart-pez-file" type="file" accept=".pez,application/octet-stream" className={field} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <button type="button" onClick={uploadChartFile} disabled={!selectedFile || uploading} className="mt-2 border border-line px-4 py-2 text-xs text-neutral-200 disabled:opacity-40">{uploading ? "アップロード中..." : "GitHub Releaseにアップロード"}</button>
              {selectedFile && <p className="mt-2 text-xs text-neutral-500">{selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>}
              <p className="mt-2 break-all text-xs text-neutral-600">{chart.fileUrl ? "登録済み: " + chart.fileUrl : "アップロード後、ダウンロードURLがここに自動入力されます。"}</p>
            </div>
            <label className={label}>登録日<input type="date" className={field} value={chart.publishedAt} onChange={(e) => setChart({ ...chart, publishedAt: e.target.value })} required /></label>
            <label className={label}>関連企画（複数選択可）<select multiple className={field + " min-h-32"} value={chart.projectIds} onChange={(e) => setChart({ ...chart, projectIds: Array.from(e.target.selectedOptions, (option) => option.value) })}>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label className={label + " sm:col-span-2"}>説明<textarea className={field + " min-h-24"} value={chart.description || ""} onChange={(e) => setChart({ ...chart, description: e.target.value })} /></label>
            <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="bg-white px-5 py-3 text-xs font-medium text-black disabled:opacity-50">{busy ? "保存中..." : editingId ? "変更を保存" : "譜面を登録"}</button>{editingId && <button type="button" onClick={cancelEdit} className="border border-line px-5 py-3 text-xs text-neutral-300">キャンセル</button>}</div>
          </form>
        </section>
        <section className="mt-10"><h2 className="mb-4 text-lg">登録済み譜面</h2><div className="divide-y divide-line border-y border-line">{data.charts.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate text-sm">{item.title}</p><p className="mt-1 text-xs text-neutral-600">{item.charter} · {item.difficulty} {item.level}</p></div><div className="flex shrink-0 gap-3"><button onClick={() => editChart(item)} className="text-xs text-neutral-300 hover:text-white">編集</button><button onClick={() => removeChart(item.id)} className="text-xs text-red-400 hover:text-red-300">削除</button></div></div>)}{!data.charts.length && <p className="py-10 text-center text-sm text-neutral-600">譜面はまだ登録されていません。</p>}</div></section>
      </> : <>
        <section className="mt-8 border border-line p-5 sm:p-7">
          <h2 className="text-lg">{editingId ? "企画を編集" : "企画を新規登録"}</h2>
          <form onSubmit={submitProject} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className={label}>ID（英数字・ハイフン）<input className={field} value={project.id} disabled={!!editingId} onChange={(e) => setProject({ ...project, id: e.target.value })} required /></label>
            <label className={label}>企画名<input className={field} value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} required /></label>
            <label className={label}>開催年<input type="number" className={field} value={project.year} onChange={(e) => setProject({ ...project, year: Number(e.target.value) })} required /></label>
            <label className={label}>主催者<input className={field} value={project.organizer || ""} onChange={(e) => setProject({ ...project, organizer: e.target.value })} /></label>
            <label className={label}>開始日<input type="date" className={field} value={project.startDate || ""} onChange={(e) => setProject({ ...project, startDate: e.target.value })} /></label>
            <label className={label}>終了日<input type="date" className={field} value={project.endDate || ""} onChange={(e) => setProject({ ...project, endDate: e.target.value })} /></label>
            <label className={label + " sm:col-span-2"}>カバー画像URL<input className={field} value={project.cover || ""} onChange={(e) => setProject({ ...project, cover: e.target.value })} placeholder="https://..." /></label>
            <label className={label + " sm:col-span-2"}>企画概要<textarea className={field + " min-h-32"} value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} required /></label>
            <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="bg-white px-5 py-3 text-xs font-medium text-black disabled:opacity-50">{busy ? "保存中..." : editingId ? "変更を保存" : "企画を登録"}</button>{editingId && <button type="button" onClick={cancelEdit} className="border border-line px-5 py-3 text-xs text-neutral-300">キャンセル</button>}</div>
          </form>
        </section>
        <section className="mt-10"><h2 className="mb-4 text-lg">登録済み企画</h2><div className="divide-y divide-line border-y border-line">{data.projects.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate text-sm">{item.name}</p><p className="mt-1 text-xs text-neutral-600">{item.year} · {item.organizer || "主催者未設定"}</p></div><div className="flex shrink-0 gap-3"><button onClick={() => editProject(item)} className="text-xs text-neutral-300 hover:text-white">編集</button><button onClick={() => removeProject(item.id)} className="text-xs text-red-400 hover:text-red-300">削除</button></div></div>)}{!data.projects.length && <p className="py-10 text-center text-sm text-neutral-600">企画はまだ登録されていません。</p>}</div></section>
      </>}
    </div>
  );
}