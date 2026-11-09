"use client";

import { useEffect, useState } from "react";
import { defaultBossAppearanceSettings, normalizeBossAppearanceSettings, type BossAppearanceSettings, type Chart, type Project, type JacketOrder } from "@/lib/data";

type PublicData = { charts: Chart[]; projects: Project[]; jacketOrder: JacketOrder; bossAppearance: BossAppearanceSettings };

export function usePublicData() {
  const [data, setData] = useState<PublicData>({ charts: [], projects: [], jacketOrder: {}, bossAppearance: defaultBossAppearanceSettings });
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
        if (active) setData({ ...value, charts: (value.charts || []).map(({ charterSearch: _privateSearch, ...chart }) => chart), jacketOrder: value.jacketOrder || {}, bossAppearance: normalizeBossAppearanceSettings(value.bossAppearance) });
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
