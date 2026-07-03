"use client";

import { useEffect, useState } from "react";
import { getWeeklyReport } from "@/services/weekly-report/getWeeklyReport";
import type { WeeklyReportViewModel } from "@/types/api/weekly-report";

type State =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function useWeeklyReport(weekStart: string, userName: string) {
  const [data, setData] = useState<WeeklyReportViewModel | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;

    getWeeklyReport(weekStart, userName).then((result) => {
      if (!active) return;
      if (result.kind === "ok") {
        setData(result.data);
        setState(result.data.items.length ? { kind: "ready" } : { kind: "empty" });
        return;
      }
      setData(null);
      setState({ kind: "error", message: result.message });
    });

    return () => {
      active = false;
    };
  }, [weekStart, userName]);

  return { data, state };
}
