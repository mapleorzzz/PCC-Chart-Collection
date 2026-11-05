import Link from "next/link";
import { formatLevel, getOrderedJacketImages, type Chart, type JacketOrder } from "@/lib/data";
import { JacketCarousel } from "@/components/jacket-carousel";

export function ChartCard({ chart, group = [chart], jacketOrder = {} }: { chart: Chart; group?: Chart[]; jacketOrder?: JacketOrder }) {
  const jacketImages = getOrderedJacketImages(group, jacketOrder);
  return (
    <Link href={`/charts/${chart.id}`} className="group block">
      <div className="aspect-square overflow-hidden border border-line bg-[#171717]">
        <JacketCarousel images={jacketImages} alt={chart.title} />
      </div>
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-neutral-100 group-hover:text-white">{chart.title}</h3>
          <p className="mt-1 truncate text-xs text-muted">{chart.artist}</p>
        </div>
        <span className="flex max-w-[48%] shrink-0 flex-wrap justify-end gap-1">{group.map((item) => <span key={item.id} className="border border-neutral-700 px-2 py-1 text-[10px] tracking-wider text-neutral-300">{item.difficulty} {formatLevel(item.level)}</span>)}</span>
      </div>
    </Link>
  );
}