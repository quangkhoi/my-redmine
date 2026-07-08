"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "@/services/dashboard/getDashboard";
import type { DashboardViewModel } from "@/types/api/dashboard";

type State =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function useDashboard(reportDate: string, userName: string) {
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;

    getDashboard(reportDate, userName).then((result) => {
      if (!active) return;
      if (result.kind === "ok") {
        setData(result.data);
        setState(result.data.metrics.length ? { kind: "ready" } : { kind: "empty" });
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
