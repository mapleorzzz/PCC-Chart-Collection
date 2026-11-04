import Link from "next/link";
import { formatLevel, type Chart } from "@/lib/data";

export function ChartCard({ chart, group = [chart] }: { chart: Chart; group?: Chart[] }) {
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
          <p className="mt-1 truncate text-xs text-muted">{chart.artist}</p><p className="mt-1 text-[10px] text-neutral-600">{group.length} DIFFICULT{group.length === 1 ? "Y" : "IES"}</p>
        </div>
        <span className="flex max-w-[48%] shrink-0 flex-wrap justify-end gap-1">{group.map((item) => <span key={item.id} className="border border-neutral-700 px-2 py-1 text-[10px] tracking-wider text-neutral-300">{item.difficulty} {formatLevel(item.level)}</span>)}</span>
      </div>
    </Link>
  );
}