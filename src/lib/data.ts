import charts from "@/data/charts.json";
import projects from "@/data/projects.json";

export type Chart = {
  id: string;
  title: string;
  artist: string;
  charter: string;
  difficulty: "EZ" | "HD" | "IN" | "AT";
  level: string;
  jacket?: string;
  fileUrl?: string;
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

export function getChart(id: string) {
  return allCharts.find((chart) => chart.id === id);
}

export function getProject(id: string) {
  return allProjects.find((project) => project.id === id);
}