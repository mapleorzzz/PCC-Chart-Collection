"use client";

import { useEffect, useState } from "react";

export function JacketCarousel({ images, alt = "", className = "" }: { images: string[]; alt?: string; className?: string }) {
  const imageKey = images.join("|");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [slotImages, setSlotImages] = useState<[string, string]>(() => [images[0] || "", ""]);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setActiveSlot(0);
    setSlotImages([images[0] || "", ""]);
    setNextIndex(null);
    setFading(false);
  }, [imageKey]);

  useEffect(() => {
    if (images.length <= 1 || nextIndex !== null) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const target = (currentIndex + 1) % images.length;
      const inactiveSlot = (1 - activeSlot) as 0 | 1;
      const preload = new Image();
      preload.onload = () => {
        if (cancelled) return;
        setSlotImages((previous) => {
          const updated: [string, string] = [...previous];
          updated[inactiveSlot] = images[target];
          return updated;
        });
        setNextIndex(target);
      };
      preload.onerror = () => {
        // Keep the current jacket visible if the next image cannot be loaded.
      };
      preload.src = images[target];
    }, 5000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [imageKey, currentIndex, activeSlot, nextIndex]);

  useEffect(() => {
    if (nextIndex === null) return;
    let finishTimer: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      setFading(true);
      finishTimer = window.setTimeout(() => {
        setCurrentIndex(nextIndex);
        setSlotImages((previous) => {
          const updated: [string, string] = [...previous];
          updated[activeSlot] = images[nextIndex];
          return updated;
        });
        setActiveSlot((slot) => (1 - slot) as 0 | 1);
        setNextIndex(null);
        setFading(false);
      }, 1000);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
    };
  }, [nextIndex, activeSlot, images]);

  if (!images.length) return <div className={`flex h-full w-full items-center justify-center text-xs tracking-[0.25em] text-neutral-700 ${className}`}>NO JACKET</div>;

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {[0, 1].map((slot) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slot}
          src={slotImages[slot] || images[0]}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: slot === activeSlot ? 1 : (fading ? 1 : 0),
            zIndex: slot === activeSlot ? 1 : 2,
          }}
        />
      ))}
    </div>
  );
}
