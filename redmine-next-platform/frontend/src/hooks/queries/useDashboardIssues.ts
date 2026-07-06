"use client";

import { useEffect, useState } from "react";
import { getDashboardIssues } from "@/services/dashboard/getDashboardIssues";
import type { DashboardIssuesViewModel } from "@/types/api/dashboard-issues";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export function useDashboardIssues() {
  const [data, setData] = useState<DashboardIssuesViewModel | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  const load = (startDate: string, endDate: string) => {
    setState({ kind: "loading" });
    setData(null);

    getDashboardIssues(startDate, endDate).then((result) => {
      if (result.kind === "ok") {
        setData(result.data);
        setState({ kind: "ready" });
        return;
      }
      setData(null);
      setState({ kind: "error", message: result.message });
    });
  };

  return { data, state, load };
}
