"use client";

import { useDashboard } from "@/hooks/queries/useDashboard";
import type { DashboardViewModel } from "@/types/api/dashboard";

type Props = {
  reportDate: string;
  userName: string;
};

function DashboardState({ kind, message }: { kind: "loading" | "empty" | "error"; message?: string }) {
  const copy = {
    loading: "Loading dashboard...",
    empty: "No dashboard data found.",
    error: message ?? "Something went wrong.",
  }[kind];

  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">{copy}</div>;
}

function getMetric(data: DashboardViewModel | null, index: number, fallbackLabel: string) {
  const metric = data?.metrics[index];
  return {
    label: metric?.label ?? fallbackLabel,
    value: metric?.value ?? 0,
    code: metric?.code ?? `metric_${index + 1}`,
  };
}

export function AdminDashboard({ reportDate, userName }: Props) {
  const { data, state } = useDashboard(reportDate, userName);
  const readyData = state.kind === "ready" ? data : null;
  const metrics = [
    getMetric(readyData, 0, "Open issues"),
    getMetric(readyData, 1, "Hours logged"),
    getMetric(readyData, 2, "Attention items"),
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard / My Dashboard</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Operational summary for {userName} on {reportDate}.</p>
          </div>
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60">
            Refresh
          </button>
        </div>
      </div>

      {state.kind === "loading" && <DashboardState kind="loading" />}
      {state.kind === "error" && <DashboardState kind="error" message={state.message} />}
      {state.kind === "empty" && <DashboardState kind="empty" />}

      {readyData && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {metrics.map((metric, index) => (
              <article
                key={metric.code}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_1px_0_rgba(255,255,255,0.02)] transition hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">{metric.label}</p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                    #{index + 1}
                  </span>
                </div>
                <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-white">{metric.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{metric.code}</p>
              </article>
            ))}
          </div>

          <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="text-lg font-semibold tracking-tight">Metrics</h2>
              <p className="mt-1 text-sm text-slate-400">Data is read directly from Redmine using ID-based user mapping.</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-[1.2fr_1fr] gap-4 border-b border-white/10 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>Metric</span>
                  <span>Value</span>
                </div>
                <div className="divide-y divide-white/10">
                  {readyData.metrics.map((metric) => (
                    <div key={metric.code} className="grid grid-cols-[1.2fr_1fr] gap-4 px-4 py-3 text-sm">
                      <div>
                        <p className="text-white">{metric.label}</p>
                        <p className="text-xs text-slate-500">{metric.code}</p>
                      </div>
                      <div className="text-right text-white tabular-nums">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="text-lg font-semibold tracking-tight">Snapshot</h2>
              <dl className="mt-3 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Snapshot date</dt>
                  <dd className="text-white">{reportDate}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">User</dt>
                  <dd className="text-white">{userName}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Metric count</dt>
                  <dd className="text-white">{readyData.metrics.length}</dd>
                </div>
              </dl>
            </article>
          </section>
        </div>
      )}
    </section>
  );
}
