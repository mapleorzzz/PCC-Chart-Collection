import charts from "@/data/charts.json";
import projects from "@/data/projects.json";

export type Chart = {
  id: string;
  title: string;
  artist: string;
  songId?: string;
  charter: string;
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
