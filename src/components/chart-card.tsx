import Link from "next/link";
import type { Chart } from "@/lib/data";

export function ChartCard({ chart }: { chart: Chart }) {
  return (
    <Link href={`/charts/${chart.id}`} className="group block">
      <div className="aspect-square overflow-hidden border border-line bg-[#171717]">
        {chart.jacket ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={chart.jacket} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs tracking-[0.25em] text-neutral-700">NO JACKET</div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-neutral-100 group-hover:text-white">{chart.title}</h3>
          <p className="mt-1 truncate text-xs text-muted">{chart.charter} / {chart.artist}</p>
        </div>
        <span className="shrink-0 border border-neutral-700 px-2 py-1 text-[10px] tracking-wider text-neutral-300">{chart.difficulty} {chart.level}</span>
      </div>
    </Link>
  );
}