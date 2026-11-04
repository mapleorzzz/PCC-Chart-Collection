"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePublicData } from "@/lib/use-public-data";
import { formatLevel } from "@/lib/data";

export default function ChartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { charts, loading, error } = usePublicData();
  const chart = charts.find((item) => item.id === id);
  const groupKey = chart ? (chart.songId?.trim() || `chart:${chart.id}`) : "";
  const songCharts = chart ? charts.filter((item) => (item.songId?.trim() || `chart:${item.id}`) === groupKey)
    .sort((a, b) => ["EZ", "HD", "IN", "AT", "Other"].indexOf(a.difficulty) - ["EZ", "HD", "IN", "AT", "Other"].indexOf(b.difficulty)) : [];
  const jacketImages = Array.from(new Set(songCharts.map((item) => item.jacket?.trim()).filter((src): src is string => Boolean(src))));
  const [jacketIndex, setJacketIndex] = useState(0);
  const [nextJacketIndex, setNextJacketIndex] = useState<number | null>(null);
  const [isJacketFading, setIsJacketFading] = useState(false);

  useEffect(() => {
    setJacketIndex(0);
    setNextJacketIndex(null);
    setIsJacketFading(false);
  }, [groupKey]);

  useEffect(() => {
    if (jacketImages.length <= 1) return;

    let cancelled = false;
    let intervalId: number | undefined;
    let fadeTimeoutId: number | undefined;
    let firstFrameId: number | undefined;
    let secondFrameId: number | undefined;

    const showNextJacket = () => {
      const nextIndex = (jacketIndex + 1) % jacketImages.length;
      const preload = new Image();
      preload.onload = () => {
        if (cancelled) return;
        setNextJacketIndex(nextIndex);
        setIsJacketFading(false);

        // 画像を opacity: 0 の状態で一度描画してから、同時にクロスフェードを開始する
        firstFrameId = window.requestAnimationFrame(() => {
          secondFrameId = window.requestAnimationFrame(() => {
            if (cancelled) return;
            setIsJacketFading(true);
          });
        });

        fadeTimeoutId = window.setTimeout(() => {
          if (cancelled) return;
          setJacketIndex(nextIndex);
          setNextJacketIndex(null);
          setIsJacketFading(false);
        }, 1000);
      };
      preload.onerror = () => {
        if (cancelled) return;
        setJacketIndex(nextIndex);
      };
      preload.src = jacketImages[nextIndex];
    };

    intervalId = window.setInterval(showNextJacket, 5000);
    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (fadeTimeoutId !== undefined) window.clearTimeout(fadeTimeoutId);
      if (firstFrameId !== undefined) window.cancelAnimationFrame(firstFrameId);
      if (secondFrameId !== undefined) window.cancelAnimationFrame(secondFrameId);
    };
  }, [jacketImages.join("|"), jacketIndex]);

  if (loading) return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-xs text-neutral-600">LOADING...</div>;
  if (error) return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-sm text-neutral-500">データを読み込めませんでした。再読み込みしてください。</div>;
  if (!chart) return <div className="mx-auto max-w-5xl px-5 py-24 text-center"><p className="text-sm text-neutral-500">譜面が見つかりません。</p><Link href="/charts" className="mt-5 inline-block text-xs text-neutral-400 hover:text-white">← ALL CHARTS</Link></div>;
  const videos = songCharts
    .filter((item) => item.youtubeUrl)
    .map((item) => {
      const youtubeUrl = item.youtubeUrl!;
      let youtubeId: string | null = null;
      try {
        const url = new URL(youtubeUrl);
        if (url.hostname === "youtu.be") youtubeId = url.pathname.slice(1).split("/")[0] || null;
        else if (url.hostname.endsWith("youtube.com")) {
          if (url.pathname === "/watch") youtubeId = url.searchParams.get("v");
          else {
            const parts = url.pathname.split("/").filter(Boolean);
            if (["embed", "shorts", "live"].includes(parts[0])) youtubeId = parts[1] || null;
          }
        }
      } catch {}
      return { chart: item, url: youtubeUrl, id: youtubeId };
    });
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-5 sm:py-16">
      <Link href="/charts" className="text-xs text-neutral-500 hover:text-white">← ALL CHARTS</Link>
      <div className="mt-6 grid min-w-0 gap-7 md:mt-8 md:grid-cols-[minmax(0,340px)_1fr] md:gap-10">
        <div className="relative aspect-square overflow-hidden border border-line bg-panel">
          {jacketImages.length > 0 ? (
            <>
              <img
                src={jacketImages[jacketIndex]}
                alt={chart.title}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${isJacketFading ? "opacity-0" : "opacity-100"}`}
              />
              {nextJacketIndex !== null && (
                <img
                  src={jacketImages[nextJacketIndex]}
                  alt={chart.title}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${isJacketFading ? "opacity-100" : "opacity-0"}`}
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs tracking-widest text-neutral-700">NO JACKET</div>
          )}
        </div>
        <div>
          <h1 className="mt-4 break-words text-2xl font-light sm:text-4xl">{chart.title}</h1>
          <p className="mt-3 text-sm text-neutral-500">{chart.artist}</p>
          <section className="mt-8">
            <p className="mb-3 text-[10px] tracking-[0.3em] text-neutral-600">AVAILABLE CHARTS</p>
            <div className="divide-y divide-line border-y border-line">
              {songCharts.map((entry) => (
                <div key={entry.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                  <div><p className="text-sm">{entry.difficulty} <span className="text-neutral-400">{formatLevel(entry.level)}</span></p><p className="mt-1 text-xs text-neutral-500">Charter: {entry.charter} · {entry.publishedAt}</p>{entry.description && <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-neutral-500">{entry.description}</p>}</div>
                  {entry.fileUrl ? <a href={entry.fileUrl} className="inline-flex min-h-10 items-center justify-center bg-white px-4 py-2 text-[10px] font-medium tracking-wider text-black hover:bg-neutral-200" download>DOWNLOAD .PEZ ↓</a> : <span className="text-xs text-neutral-600">ファイル準備中</span>}
                </div>
              ))}
            </div>
          </section>
          {videos.length > 0 && <section className="mt-8"><p className="mb-3 text-[10px] tracking-[0.3em] text-neutral-600">PLAY VIDEO</p><div className="grid gap-6">{videos.map(({ chart: videoChart, url, id: videoId }) => <div key={videoChart.id}><p className="mb-2 text-xs text-neutral-400">{videoChart.difficulty} {formatLevel(videoChart.level)}</p>{videoId ? <div className="aspect-video overflow-hidden border border-line bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={`${chart.title} - ${videoChart.difficulty} YouTube`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <a href={url} target="_blank" rel="noreferrer" className="text-sm text-neutral-300 underline underline-offset-4">YouTubeで動画を見る ↗</a>}</div>)}</div></section>}
        </div>
      </div>
    </div>
  );
}
