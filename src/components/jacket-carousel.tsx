"use client";

import { useEffect, useState } from "react";

export function JacketCarousel({ images, alt = "", className = "" }: { images: string[]; alt?: string; className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  useEffect(() => { setCurrentIndex(0); setNextIndex(null); setFading(false); }, [images.join("|")]);
  useEffect(() => {
    if (images.length <= 1 || nextIndex !== null) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const target = (currentIndex + 1) % images.length;
      const preload = new Image();
      preload.onload = () => { if (!cancelled) setNextIndex(target); };
      preload.onerror = () => { if (!cancelled) setCurrentIndex(target); };
      preload.src = images[target];
    }, 5000);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [images.join("|"), currentIndex, nextIndex]);
  useEffect(() => {
    if (nextIndex === null) return;
    let finishTimer: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      setFading(true);
      finishTimer = window.setTimeout(() => { setCurrentIndex(nextIndex); setNextIndex(null); setFading(false); }, 1000);
    });
    return () => { window.cancelAnimationFrame(frame); if (finishTimer !== undefined) window.clearTimeout(finishTimer); };
  }, [nextIndex]);
  if (!images.length) return <div className={`flex h-full w-full items-center justify-center text-xs tracking-[0.25em] text-neutral-700 ${className}`}>NO JACKET</div>;
  return <div className={`relative h-full w-full overflow-hidden ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={images[currentIndex] || images[0]} alt={alt} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out" style={{ opacity: fading ? 0 : 1 }} />
    {nextIndex !== null && <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[nextIndex]} alt={alt} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out" style={{ opacity: fading ? 1 : 0 }} />
    </>}
  </div>;
}
