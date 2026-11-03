"use client";

import { useEffect, useState } from "react";
import type { Chart, Project } from "@/lib/data";

type PublicData = { charts: Chart[]; projects: Project[] };

export function usePublicData() {
  const [data, setData] = useState<PublicData>({ charts: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/public/data", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("データ取得に失敗しました");
        return response.json();
      })
      .then((value: PublicData) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return { ...data, loading, error };
}
