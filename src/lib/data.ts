import charts from "@/data/charts.json";
import projects from "@/data/projects.json";

export type Chart = {
  id: string;
  title: string;
  artist: string;
  songId?: string;
  isBoss?: boolean;
  charter: string;
  charterSearch?: string[];
  difficulty: "EZ" | "HD" | "IN" | "AT" | "Other";
  level: string;
  jacket?: string;
  fileUrl?: string;
  youtubeUrl?: string;
  projectIds: string[];
  publishedAt: string;
  description?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  organizer?: string;
  startDate?: string;
  endDate?: string;
  year: number;
  cover?: string;
};

export const allCharts = charts as Chart[];
export const allProjects = projects as Project[];

export function formatLevel(level: string) {
  return `Lv.${level.replace(/^Lv\.?\s*/i, "").replace(/(\d+)\.\d+/, "$1")}`;
}

export type JacketOrder = Record<string, string[]>;

export type BossAppearance = {
  labelText: string;
  labelColor: string;
  lineColor: string;
  frameColor: string;
  cornerGradientStart: string;
  cornerGradientEnd: string;
  cornerTopLeft: string;
  cornerTopRight: string;
  cornerBottomLeft: string;
  cornerBottomRight: string;
};
export type BossAppearanceSettings = { default: BossAppearance; songs: Record<string, BossAppearance> };
export const defaultBossAppearance: BossAppearance = {
  labelText: "PCC · SPECIAL ARCHIVE",
  labelColor: "#a7f3d0",
  lineColor: "#ffffff",
  frameColor: "#ffffff",
  cornerGradientStart: "#a7f3d0",
  cornerGradientEnd: "#ffffff",
  cornerTopLeft: "#a7f3d0",
  cornerTopRight: "#ffffff",
  cornerBottomLeft: "#a7f3d0",
  cornerBottomRight: "#ffffff"
};
export const defaultBossAppearanceSettings: BossAppearanceSettings = { default: defaultBossAppearance, songs: {} };
export function normalizeBossAppearanceSettings(value: unknown): BossAppearanceSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultBossAppearanceSettings;
  const record = value as Record<string, unknown>;
  if (record.default && typeof record.default === "object" && !Array.isArray(record.default)) {
    const rawSongs = record.songs && typeof record.songs === "object" && !Array.isArray(record.songs) ? record.songs as Record<string, Partial<BossAppearance>> : {};
    return {
      default: { ...defaultBossAppearance, ...(record.default as Partial<BossAppearance>),
        cornerTopLeft: (record.default as Partial<BossAppearance>).cornerTopLeft || (record.default as Partial<BossAppearance>).cornerGradientStart || defaultBossAppearance.cornerTopLeft,
        cornerTopRight: (record.default as Partial<BossAppearance>).cornerTopRight || (record.default as Partial<BossAppearance>).cornerGradientEnd || defaultBossAppearance.cornerTopRight,
        cornerBottomLeft: (record.default as Partial<BossAppearance>).cornerBottomLeft || (record.default as Partial<BossAppearance>).cornerGradientStart || defaultBossAppearance.cornerBottomLeft,
        cornerBottomRight: (record.default as Partial<BossAppearance>).cornerBottomRight || (record.default as Partial<BossAppearance>).cornerGradientEnd || defaultBossAppearance.cornerBottomRight },
      songs: Object.fromEntries(Object.entries(rawSongs).map(([key, appearance]) => [key, {
        ...defaultBossAppearance, ...appearance,
        cornerTopLeft: appearance.cornerTopLeft || appearance.cornerGradientStart || defaultBossAppearance.cornerTopLeft,
        cornerTopRight: appearance.cornerTopRight || appearance.cornerGradientEnd || defaultBossAppearance.cornerTopRight,
        cornerBottomLeft: appearance.cornerBottomLeft || appearance.cornerGradientStart || defaultBossAppearance.cornerBottomLeft,
        cornerBottomRight: appearance.cornerBottomRight || appearance.cornerGradientEnd || defaultBossAppearance.cornerBottomRight
      }]))
    };
  }
  if ("labelText" in record || "labelColor" in record || "frameColor" in record) {
    return { default: { ...defaultBossAppearance, ...(record as Partial<BossAppearance>),
      cornerTopLeft: (record as Partial<BossAppearance>).cornerTopLeft || (record as Partial<BossAppearance>).cornerGradientStart || defaultBossAppearance.cornerTopLeft,
      cornerTopRight: (record as Partial<BossAppearance>).cornerTopRight || (record as Partial<BossAppearance>).cornerGradientEnd || defaultBossAppearance.cornerTopRight,
      cornerBottomLeft: (record as Partial<BossAppearance>).cornerBottomLeft || (record as Partial<BossAppearance>).cornerGradientStart || defaultBossAppearance.cornerBottomLeft,
      cornerBottomRight: (record as Partial<BossAppearance>).cornerBottomRight || (record as Partial<BossAppearance>).cornerGradientEnd || defaultBossAppearance.cornerBottomRight }, songs: {} };
  }
  return defaultBossAppearanceSettings;
}

export function getSongGroupKey(chart: Chart) {
  return chart.songId?.trim() || `chart:${chart.id}`;
}

export function getOrderedJacketImages(charts: Chart[], jacketOrder: JacketOrder = {}) {
  if (!charts.length) return [];
  const unique = Array.from(new Set(charts.map((chart) => chart.jacket?.trim()).filter((src): src is string => Boolean(src))));
  const configured = jacketOrder[getSongGroupKey(charts[0])] || [];
  const ordered = configured.filter((src) => unique.includes(src));
  return [...ordered, ...unique.filter((src) => !ordered.includes(src))];
}

export function groupCharts(charts: Chart[]) {
  const groups = new Map<string, Chart[]>();
  for (const chart of charts) {
    const key = chart.songId?.trim() || `chart:${chart.id}`;
    groups.set(key, [...(groups.get(key) || []), chart]);
  }
  return Array.from(groups.values()).map((items) => ({ chart: items[0], charts: items.sort((a, b) => ["EZ", "HD", "IN", "AT", "Other"].indexOf(a.difficulty) - ["EZ", "HD", "IN", "AT", "Other"].indexOf(b.difficulty)) }));
}

export function getChart(id: string) {
  return allCharts.find((chart) => chart.id === id);
}

export function getProject(id: string) {
  return allProjects.find((project) => project.id === id);
}
