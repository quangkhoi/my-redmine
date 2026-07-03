"use client";

import { useEffect, useState } from "react";
import { getMyTask } from "@/services/my-task/getMyTask";
import type { MyTaskViewModel } from "@/types/api/my-task";

type TaskState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function useMyTask(userName: string) {
  const [data, setData] = useState<MyTaskViewModel | null>(null);
  const [state, setState] = useState<TaskState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });

    getMyTask(userName)
      .then((result) => {
        if (!active) {
          return;
        }

        if (result.kind === "ok") {
          setData(result.data);
          setState(result.data.items.length ? { kind: "ready" } : { kind: "empty" });
          return;
        }

        setData(null);
        setState({ kind: "error", message: result.message });
      })
      .catch(() => {
        if (active) {
          setData(null);
          setState({ kind: "error", message: "Unexpected error." });
        }
      });

    return () => {
      active = false;
    };
  }, [userName]);

  return { data, state };
}
