"use client";

import { useState } from "react";
import { useDashboardIssues } from "@/hooks/queries/useDashboardIssues";
import { useSearch } from "@/contexts/SearchContext";
import { getIssueUrl } from "@/lib/issue-url";
import { getHighlightClass } from "@/lib/highlight";
import { filterBySearch, buildSearchText } from "@/lib/search";
import { SearchHighlight } from "@/components/ui/SearchHighlight";
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

function IssueRow({ issue, index, listName, searchTerm }: { issue: DashboardIssueViewModel; index: number; listName: string; searchTerm: string }) {
  const highlightClass = getHighlightClass(issue.statusName, issue.trackerName, issue.dueDate, issue.startDate);
  return (
    <tr className={highlightClass}>
      <td className="px-3 py-2 text-sm text-muted-foreground">{index + 1}</td>
      <td className="px-3 py-2 text-sm">
        <a
          href={getIssueUrl(issue.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 hover:underline"
        >
          #{issue.id}
        </a>
      </td>
      <td className="px-3 py-2 text-sm text-foreground"><SearchHighlight text={issue.subject} term={searchTerm} /></td>
      <td className="px-3 py-2 text-sm text-muted-foreground"><SearchHighlight text={issue.projectName ?? "-"} term={searchTerm} /></td>
      <td className="px-3 py-2 text-sm text-muted-foreground"><SearchHighlight text={issue.trackerName ?? "-"} term={searchTerm} /></td>
      <td className="px-3 py-2 text-sm text-muted-foreground"><SearchHighlight text={issue.assigneeName ?? "-"} term={searchTerm} /></td>
      <td className="px-3 py-2 text-sm text-muted-foreground"><SearchHighlight text={issue.statusName ?? "-"} term={searchTerm} /></td>
      <td className="px-3 py-2 text-sm text-muted-foreground">{issue.startDate ?? "-"}</td>
      <td className="px-3 py-2 text-sm">
        {issue.dueDate ? (
          <span className={getHighlightClass(issue.statusName, issue.trackerName, issue.dueDate, issue.startDate).includes("bg-red-500") ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}>
            {issue.dueDate}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, issue.doneRatio))}%` }}
            />
          </div>
          <span className="tabular-nums">{issue.doneRatio}%</span>
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">{formatHours(issue.spentHours)}</td>
      <td className="px-3 py-2 text-sm text-muted-foreground">{issue.releaseTarget ?? "-"}</td>
    </tr>
  );
}

function IssueTable({ list, label, searchTerm }: { list: DashboardIssueListViewModel; label: string; searchTerm: string }) {
  return (
    <article className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {list.issues.length}
        </span>
      </div>
      {list.issues.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No issues.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
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
            <tbody className="divide-y divide-border">
              {list.issues.map((issue, index) => (
                <IssueRow key={issue.id} issue={issue} index={index} listName={list.name} searchTerm={searchTerm} />
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
  const { searchTerm } = useSearch();

  const handleLoad = () => {
    load(startDate, endDate);
  };

  const toSearchText = (i: DashboardIssueViewModel) =>
    buildSearchText(i.id, i.subject, i.projectName, i.assigneeName, i.statusName, i.trackerName);

  const visibleProcessing = filterBySearch(data?.processing.issues ?? [], searchTerm, toSearchText);
  const visibleNotStarted = getVisibleIssues(data?.notStarted.issues ?? [], "notStarted", { hideNotStartedNonDevelopment, hideProcessedResearch });
  const visibleNotStartedFiltered = filterBySearch(visibleNotStarted, searchTerm, toSearchText);
  const visibleProcessed = getVisibleIssues(data?.processed.issues ?? [], "processed", { hideNotStartedNonDevelopment, hideProcessedResearch });
  const visibleProcessedFiltered = filterBySearch(visibleProcessed, searchTerm, toSearchText);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Dashboard / Issues</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Issues by status across all team members.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={handleLoad}
          disabled={state.kind === "loading"}
          className="rounded-xl border border-border bg-secondary px-4 py-2 text-sm text-card-foreground transition hover:border-border/80 hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-50"
        >
          {state.kind === "loading" ? "Loading..." : "Load"}
        </button>
      </div>

      {state.kind === "idle" && (
        <div className="rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
          Select a date range and click Load to view issues.
        </div>
      )}

      {state.kind === "error" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
          {state.message}
        </div>
      )}

      {state.kind === "ready" && data && (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{visibleProcessing.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Not Started</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{visibleNotStartedFiltered.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Processed</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{visibleProcessedFiltered.length}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={hideNotStartedNonDevelopment}
                onChange={(e) => setHideNotStartedNonDevelopment(e.target.checked)}
                className="rounded border-border/80 bg-secondary"
              />
              Hide non-開発 (Not Started)
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={hideProcessedResearch}
                onChange={(e) => setHideProcessedResearch(e.target.checked)}
                className="rounded border-border/80 bg-secondary"
              />
              Hide 調査 (Processed)
            </label>
          </div>

          <IssueTable list={{ name: data.processing.name, issues: visibleProcessing }} label="Processing (処理中)" searchTerm={searchTerm} />
          <IssueTable list={{ name: data.notStarted.name, issues: visibleNotStartedFiltered }} label="Not Started (未対応)" searchTerm={searchTerm} />
          <IssueTable list={{ name: data.processed.name, issues: visibleProcessedFiltered }} label="Processed (処理済み)" searchTerm={searchTerm} />
        </div>
      )}
    </section>
  );
}
