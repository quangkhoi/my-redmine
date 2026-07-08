"use client";

import { useState } from "react";
import { useDashboardIssues } from "@/hooks/queries/useDashboardIssues";
import { getIssueUrl } from "@/lib/issue-url";
import { getHighlightClass } from "@/lib/highlight";
import type { DashboardIssueViewModel, DashboardIssueListViewModel } from "@/types/api/dashboard-issues";

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getNextFriday(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday;
}

function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return "-";
  return `${hours}h`;
}

function IssueRow({ issue, index, listName }: { issue: DashboardIssueViewModel; index: number; listName: string }) {
  const highlightClass = getHighlightClass(issue.statusName, issue.trackerName, issue.dueDate, issue.startDate);
  return (
    <tr className={highlightClass}>
      <td className="px-3 py-2 text-sm text-slate-400">{index + 1}</td>
      <td className="px-3 py-2 text-sm">
        <a
          href={getIssueUrl(issue.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 hover:underline"
        >
          #{issue.id}
        </a>
      </td>
      <td className="px-3 py-2 text-sm text-white">{issue.subject}</td>
      <td className="px-3 py-2 text-sm text-slate-300">{issue.projectName ?? "-"}</td>
      <td className="px-3 py-2 text-sm text-slate-300">{issue.trackerName ?? "-"}</td>
      <td className="px-3 py-2 text-sm text-slate-300">{issue.assigneeName ?? "-"}</td>
      <td className="px-3 py-2 text-sm text-slate-300">{issue.statusName ?? "-"}</td>
      <td className="px-3 py-2 text-sm text-slate-300">{issue.startDate ?? "-"}</td>
      <td className="px-3 py-2 text-sm">
        {issue.dueDate ? (
          <span className={getHighlightClass(issue.statusName, issue.trackerName, issue.dueDate, issue.startDate) === "bg-red-900/20" ? "text-red-400 font-medium" : "text-slate-300"}>
            {issue.dueDate}
          </span>
        ) : (
          <span className="text-slate-500">-</span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${Math.max(0, Math.min(100, issue.doneRatio))}%` }}
            />
          </div>
          <span className="tabular-nums">{issue.doneRatio}%</span>
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-slate-300">{formatHours(issue.spentHours)}</td>
      <td className="px-3 py-2 text-sm text-slate-300">{issue.releaseTarget ?? "-"}</td>
    </tr>
  );
}

function IssueTable({ list, label }: { list: DashboardIssueListViewModel; label: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">
          {list.issues.length}
        </span>
      </div>
      {list.issues.length === 0 ? (
        <div className="p-4 text-sm text-slate-500">No issues.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-black/20 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Subject</th>
                <th className="px-3 py-2 text-left font-medium">Project</th>
                <th className="px-3 py-2 text-left font-medium">Tracker</th>
                <th className="px-3 py-2 text-left font-medium">Assignee</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Start</th>
                <th className="px-3 py-2 text-left font-medium">Due</th>
                <th className="px-3 py-2 text-left font-medium">Progress</th>
                <th className="px-3 py-2 text-left font-medium">Spent</th>
                <th className="px-3 py-2 text-left font-medium">Release</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {list.issues.map((issue, index) => (
                <IssueRow key={issue.id} issue={issue} index={index} listName={list.name} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function getVisibleIssues(
  issues: DashboardIssueViewModel[],
  listName: string,
  filters: { hideNotStartedNonDevelopment: boolean; hideProcessedResearch: boolean }
): DashboardIssueViewModel[] {
  if (listName === "notStarted" && filters.hideNotStartedNonDevelopment) {
    return issues.filter((i) => i.trackerName === "開発");
  }
  if (listName === "processed" && filters.hideProcessedResearch) {
    return issues.filter((i) => i.trackerName !== "調査");
  }
  return issues;
}

export function DashboardIssuesPanel() {
  const today = new Date();
  const defaultStart = formatDate(getMondayOfWeek(today));
  const defaultEnd = formatDate(getNextFriday(today));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [hideNotStartedNonDevelopment, setHideNotStartedNonDevelopment] = useState(false);
  const [hideProcessedResearch, setHideProcessedResearch] = useState(false);
  const { data, state, load } = useDashboardIssues();

  const handleLoad = () => {
    load(startDate, endDate);
  };

  const visibleProcessing = data?.processing.issues ?? [];
  const visibleNotStarted = getVisibleIssues(data?.notStarted.issues ?? [], "notStarted", { hideNotStartedNonDevelopment, hideProcessedResearch });
  const visibleProcessed = getVisibleIssues(data?.processed.issues ?? [], "processed", { hideNotStartedNonDevelopment, hideProcessedResearch });

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard / Issues</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Issues by status across all team members.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
          />
        </div>
        <button
          onClick={handleLoad}
          disabled={state.kind === "loading"}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-50"
        >
          {state.kind === "loading" ? "Loading..." : "Load"}
        </button>
      </div>

      {state.kind === "idle" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Select a date range and click Load to view issues.
        </div>
      )}

      {state.kind === "error" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {state.message}
        </div>
      )}

      {state.kind === "ready" && data && (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Processing</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{visibleProcessing.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Not Started</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{visibleNotStarted.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Processed</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{visibleProcessed.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hideNotStartedNonDevelopment}
                onChange={(e) => setHideNotStartedNonDevelopment(e.target.checked)}
                className="rounded border-white/20 bg-black/30"
              />
              Hide non-開発 (Not Started)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hideProcessedResearch}
                onChange={(e) => setHideProcessedResearch(e.target.checked)}
                className="rounded border-white/20 bg-black/30"
              />
              Hide 調査 (Processed)
            </label>
          </div>

          <IssueTable list={{ name: data.processing.name, issues: visibleProcessing }} label="Processing (処理中)" />
          <IssueTable list={{ name: data.notStarted.name, issues: visibleNotStarted }} label="Not Started (未対応)" />
          <IssueTable list={{ name: data.processed.name, issues: visibleProcessed }} label="Processed (処理済み)" />
        </div>
      )}
    </section>
  );
}
