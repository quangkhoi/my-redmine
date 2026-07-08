"use client";

import { useEffect, useState } from "react";
import { getLogTime } from "@/services/log-time/getLogTime";
import { ASSIGNEES } from "@/config/team";
import type { LogTimeViewModel, LogTimeItem } from "@/types/api/log-time";

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

    async function fetchAll() {
      const users = ASSIGNEES.map(a => a.login);
      const results = await Promise.all(users.map(u => getLogTime(reportDate, u)));
      if (!active) return;

      const allItems: LogTimeItem[] = [];
      for (const result of results) {
        if (result.kind === "ok") {
          allItems.push(...result.data.items);
        }
      }

      if (allItems.length === 0) {
        setData(null);
        setState({ kind: "empty" });
        return;
      }

      setData({ userName: "ALL", displayName: "All Users", reportDate, items: allItems });
      setState({ kind: "ready" });
    }

    async function fetchOne() {
      const result = await getLogTime(reportDate, userName);
      if (!active) return;
      if (result.kind === "ok") {
        setData(result.data);
        setState(result.data.items.length ? { kind: "ready" } : { kind: "empty" });
        return;
      }
      setData(null);
      setState({ kind: "error", message: result.message });
    }

    if (userName === "ALL") {
      fetchAll();
    } else {
      fetchOne();
    }

    return () => {
      active = false;
    };
  }, [reportDate, userName]);

  return { data, state };
}
