"use client";

import { useEffect, useState } from "react";
import { getDailyReport } from "@/services/daily-report/getDailyReport";
import type { DailyReportViewModel } from "@/types/api/daily-report";

type State =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function useDailyReport(reportDate: string, userName: string) {
  const [data, setData] = useState<DailyReportViewModel | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;

    getDailyReport(reportDate, userName).then((result) => {
      if (!active) return;
      if (result.kind === "ok") {
        setData(result.data);
        setState(result.data.totalItems ? { kind: "ready" } : { kind: "empty" });
        return;
      }
      setData(null);
      setState({ kind: "error", message: result.message });
    });

    return () => {
      active = false;
    };
  }, [reportDate, userName]);

  return { data, state };
}
