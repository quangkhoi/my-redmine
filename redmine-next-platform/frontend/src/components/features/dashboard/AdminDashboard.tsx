"use client";

import { useDashboard } from "@/hooks/queries/useDashboard";
import type { DashboardViewModel } from "@/types/api/dashboard";

type Props = {
  reportDate: string;
  userName: string;
};

type Insight = {
  title: string;
  detail: string;
  tone: "info" | "warning" | "success";
};

type QueueItem = {
  label: string;
  value: string;
  status: string;
};

type ActivityItem = {
  actor: string;
  action: string;
  meta: string;
};

const temporaryInsights: Insight[] = [
  { title: "Sprint velocity is up 12%", detail: "The current flow is moving faster than last week.", tone: "success" },
  { title: "Issue #ECOM-411 needs attention", detail: "It is still unassigned and tracking risk.", tone: "warning" },
  { title: "Duplicate bug reports detected", detail: "A quick triage pass could reduce noisy backlog items.", tone: "info" },
];

const temporaryQueue: QueueItem[] = [
  { label: "PR review", value: "ECOM-410", status: "Approved" },
  { label: "Tickets", value: "4 items", status: "Needs triage" },
  { label: "Worklog", value: "Friday", status: "Pending" },
];

const temporaryActivity: ActivityItem[] = [
  { actor: "Sarah Chen", action: "closed ECOM-412", meta: "10m ago" },
  { actor: "Mike Ross", action: "merged PR #81", meta: "45m ago" },
  { actor: "Nina Patel", action: "updated Wiki", meta: "2h ago" },
];

function getMetricValue(data: DashboardViewModel | null, index: number, fallback: string) {
  const metric = data?.metrics[index];
  return metric ? String(metric.value) : fallback;
}

function getMetricLabel(data: DashboardViewModel | null, index: number, fallback: string) {
  return data?.metrics[index]?.label ?? fallback;
}

function DashboardState({ kind, message }: { kind: "loading" | "empty" | "error"; message?: string }) {
  const copy = {
    loading: "Loading dashboard...",
    empty: "No dashboard data found.",
    error: message ?? "Something went wrong.",
  }[kind];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
      {copy}
    </div>
  );
}

export function AdminDashboard({ reportDate, userName }: Props) {
  const { data, state } = useDashboard(reportDate, userName);
  const readyData = state.kind === "ready" ? data : null;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard / My Dashboard</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Admin overview</h1>
            <p className="mt-1 text-sm text-slate-400">Dense operational view for {userName} on {reportDate}.</p>
          </div>
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60">
            New issue
          </button>
        </div>
      </div>

      {state.kind === "loading" && <DashboardState kind="loading" />}
      {state.kind === "error" && <DashboardState kind="error" message={state.message} />}
      {state.kind === "empty" && <DashboardState kind="empty" />}

      {readyData && (
                <>
                  <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      { title: getMetricLabel(data, 0, "Open issues"), value: getMetricValue(data, 0, "142"), accent: "text-sky-300" },
                      { title: getMetricLabel(data, 1, "Active sprints"), value: getMetricValue(data, 1, "3"), accent: "text-emerald-300" },
                      { title: getMetricLabel(data, 2, "Time logged"), value: `${getMetricValue(data, 2, "340")}h`, accent: "text-amber-300" },
                      { title: "Team capacity", value: "88%", accent: "text-violet-300" },
                    ].map((item) => (
                      <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_1px_0_rgba(255,255,255,0.02)] transition hover:bg-white/[0.06]">
                        <p className="text-sm text-slate-400">{item.title}</p>
                        <p className={`mt-3 text-4xl font-semibold tracking-tight tabular-nums ${item.accent}`}>{item.value}</p>
                      </article>
                    ))}
                  </section>

                  <section className="grid gap-3 xl:grid-cols-[1.4fr_0.9fr]">
                    <article className="rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/15 via-white/[0.04] to-violet-500/10 p-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-sky-200">
                        <span>AI insights</span>
                        <span className="rounded-full border border-sky-400/30 px-2 py-0.5 text-[10px]">Temporary</span>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-200">
                        {temporaryInsights.map((insight) => (
                          <li key={insight.title} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                            <p className="font-medium text-white">{insight.title}</p>
                            <p className="mt-0.5 text-slate-300">{insight.detail}</p>
                          </li>
                        ))}
                      </ul>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <h2 className="text-lg font-semibold tracking-tight">Workflow queue</h2>
                      <p className="mt-1 text-sm text-slate-400">Action items requiring attention.</p>
                      <div className="mt-3 space-y-2">
                        {temporaryQueue.map((item) => (
                          <div key={item.label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-medium text-white">{item.label}</p>
                                <p className="text-xs text-slate-400">{item.value}</p>
                              </div>
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  </section>

                  <section className="grid gap-3 xl:grid-cols-[1.5fr_0.85fr]">
                    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight">Issues overview</h2>
                          <p className="mt-1 text-sm text-slate-400">Compact view of the current issue list.</p>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-300">
                          <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10">Filter</button>
                          <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10">Columns</button>
                          <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10">Export</button>
                        </div>
                      </div>

                      <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                        <div className="hidden grid-cols-[1.1fr_2fr_1fr_1fr_0.8fr] gap-4 border-b border-white/10 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
                          <span>ID</span>
                          <span>Subject</span>
                          <span>Status</span>
                          <span>Assignee</span>
                          <span>Updated</span>
                        </div>
                        <div className="divide-y divide-white/10">
                          {[
                            { id: "#401", subject: "Fix API auth", status: "In Progress", assignee: "AP", updated: "2h ago" },
                            { id: "#402", subject: "Update UI", status: "Review", assignee: "SC", updated: "5h ago" },
                            { id: "#403", subject: "DB migration", status: "Open", assignee: "Unassigned", updated: "1d ago" },
                          ].map((row) => (
                            <div key={row.id} className="grid gap-2 px-4 py-3 text-sm transition hover:bg-white/[0.04] md:grid-cols-[1.1fr_2fr_1fr_1fr_0.8fr] md:items-center">
                              <div className="text-sky-300">{row.id}</div>
                              <div className="text-white">{row.subject}</div>
                              <div>
                                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                                  {row.status}
                                </span>
                              </div>
                              <div className="text-slate-300">{row.assignee}</div>
                              <div className="text-slate-400">{row.updated}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>

                    <div className="space-y-3">
                      <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
                        <div className="mt-3 space-y-3">
                          {temporaryActivity.map((item) => (
                            <div key={`${item.actor}-${item.action}`} className="flex gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-slate-200">
                                {item.actor
                                  .split(" ")
                                  .map((name) => name[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="text-sm text-white">
                                  <span className="font-medium">{item.actor}</span> {item.action}
                                </p>
                                <p className="text-xs text-slate-400">{item.meta}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>

                      <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <h2 className="text-lg font-semibold tracking-tight">Snapshot</h2>
                        <dl className="mt-3 grid gap-3 text-sm">
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Snapshot date</dt>
                            <dd className="text-white">{reportDate}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-400">User</dt>
                            <dd className="text-white">{userName}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-400">Issues visible</dt>
                            <dd className="text-white">{readyData.metrics.length}</dd>
                          </div>
                        </dl>
                      </article>
                    </div>
                  </section>
                </>
      )}
    </>
  );
}
