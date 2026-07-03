"use client";

import { useEffect, useState } from "react";
import { getLogTime } from "@/services/log-time/getLogTime";
import type { LogTimeViewModel } from "@/types/api/log-time";

type State =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function useLogTime(reportDate: string, userName: string) {
  const [data, setData] = useState<LogTimeViewModel | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;

    getLogTime(reportDate, userName).then((result) => {
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
  }, [reportDate, userName]);

  return { data, state };
}
