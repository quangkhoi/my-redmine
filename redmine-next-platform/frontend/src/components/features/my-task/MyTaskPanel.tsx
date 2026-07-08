"use client";

import { useState, useMemo } from "react";
import { useMyTask } from "@/hooks/queries/useMyTask";
import { useSearch } from "@/contexts/SearchContext";
import { useTranslations } from "next-intl";
import { ASSIGNEES } from "@/config/team";
import { getIssueUrl } from "@/lib/issue-url";
import { getHighlightClass } from "@/lib/highlight";
import { getMondayOfWeek, getNextFriday, formatDate, formatDisplayDate } from "@/lib/date-utils";
import { filterBySearch, buildSearchText } from "@/lib/search";
import { SearchHighlight } from "@/components/ui/SearchHighlight";

const DEFAULT_USER = "khoiduong";

function getDefaultRange() {
  const now = new Date();
  const monday = getMondayOfWeek(now);
  const friday = getNextFriday(now);
  return { start: formatDate(monday), end: formatDate(friday) };
}

export function MyTaskPanel({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  const t = useTranslations("myTask");
  const defaultRange = getDefaultRange();
  
  const [selectedUser, setSelectedUser] = useState(DEFAULT_USER);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  
  const { data, state } = useMyTask(selectedUser, startDate, endDate);
  const { searchTerm } = useSearch();

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return filterBySearch(data.items, searchTerm, (i) =>
      buildSearchText(i.issueKey, i.subject, i.projectName, i.status, i.trackerName)
    );
  }, [data, searchTerm]);

  return (
    <section className="w-full rounded-3xl border border-border bg-secondary p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">User</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          >
            {ASSIGNEES.map((a) => (
              <option key={a.login} value={a.login}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60" />
        </div>
      </div>

      {/* States */}
      {state.kind === "loading" && <p className="mt-4 text-muted-foreground">{t("loading")}</p>}
      {state.kind === "error" && <p className="mt-4 text-red-600 dark:text-red-300">{state.message}</p>}
      {state.kind === "empty" && <p className="mt-4 text-muted-foreground">{t("empty")}</p>}

      {state.kind === "ready" && data && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <div className="hidden grid-cols-[0.5fr_0.8fr_1.5fr_2fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 border-b border-border bg-secondary px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground md:grid">
            <span>#</span>
            <span>{t("columns.issue")}</span>
            <span>Project</span>
            <span>{t("columns.subject")}</span>
            <span>{t("columns.status")}</span>
            <span>Start</span>
            <span>Due</span>
            <span>Progress</span>
          </div>
          <div className="divide-y divide-border">
            {filteredItems.map((item, index) => {
              const highlightClass = getHighlightClass(item.status, item.trackerName, item.dueDate, item.startDate);
              const issueId = parseInt(item.issueKey.replace("#", ""), 10);
              return (
                <div key={item.issueKey} className={`grid gap-2 px-4 py-3 text-sm transition hover:bg-card md:grid-cols-[0.5fr_0.8fr_1.5fr_2fr_0.8fr_0.8fr_0.8fr_0.6fr] md:items-center ${highlightClass}`}>
                  <div className="text-muted-foreground">{index + 1}</div>
                  <div>
                    <a href={getIssueUrl(issueId)} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 hover:underline">
                      {item.issueKey}
                    </a>
                  </div>
                  <div className="text-muted-foreground"><SearchHighlight text={item.projectName ?? "-"} term={searchTerm} /></div>
                  <div className="text-foreground"><SearchHighlight text={item.subject} term={searchTerm} /></div>
                  <div>
                    <span className="inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs text-card-foreground">
                      <SearchHighlight text={item.status} term={searchTerm} />
                    </span>
                  </div>
                  <div className="text-muted-foreground">{formatDisplayDate(item.startDate)}</div>
                  <div className={item.dueDate && new Date(item.dueDate) < new Date() ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}>
                    {formatDisplayDate(item.dueDate)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, item.doneRatio))}%` }} />
                      </div>
                      <span className="tabular-nums text-xs">{item.doneRatio}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
