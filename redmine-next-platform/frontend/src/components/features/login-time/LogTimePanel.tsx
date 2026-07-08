"use client";

import { useState, useMemo } from "react";
import { useLogTime } from "@/hooks/queries/useLogTime";
import { useSearch } from "@/contexts/SearchContext";
import { useTranslations } from "next-intl";
import { ASSIGNEES } from "@/config/team";
import { getIssueUrl } from "@/lib/issue-url";
import { formatDisplayDate } from "@/lib/date-utils";
import { filterBySearch, buildSearchText } from "@/lib/search";
import { SearchHighlight } from "@/components/ui/SearchHighlight";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR - 3 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function buildReportDate(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function LogTimePanel({ reportDate: initialReportDate, userName: initialUserName }: { reportDate: string; userName: string }) {
  const t = useTranslations("logTime");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const reportDate = buildReportDate(year, month);
  const userName = initialUserName;

  const [selectedUser, setSelectedUser] = useState(userName);
  const { data, state } = useLogTime(reportDate, selectedUser);
  const { searchTerm } = useSearch();

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const byUser = selectedUser === "ALL" ? data.items : data.items.filter(item => {
      const user = ASSIGNEES.find(a => a.login === selectedUser);
      return user ? item.assigneeName === user.name : true;
    });
    return filterBySearch(byUser, searchTerm, (i) =>
      buildSearchText(i.issueId, i.issueKey, i.subject, i.status, i.assigneeName)
    );
  }, [data, selectedUser, searchTerm]);

  return (
    <section className="w-full rounded-3xl border border-border bg-secondary p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-amber-600 dark:text-amber-300">{t("eyebrow")}</p>
      <h2 className="mt-4 text-3xl font-semibold">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("description")}</p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">User</label>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60">
            <option value="ALL">ALL</option>
            {ASSIGNEES.map((a) => (
              <option key={a.login} value={a.login}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* States */}
      {state.kind === "loading" && <p className="mt-4 text-muted-foreground">{t("loading")}</p>}
      {state.kind === "error" && <p className="mt-4 text-red-600 dark:text-red-300">{state.message}</p>}
      {state.kind === "empty" && <p className="mt-4 text-muted-foreground">{t("empty")}</p>}

      {state.kind === "ready" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">{t("reportDate")}</p>
              <p className="text-lg font-medium">{year}/{String(month).padStart(2, "0")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("userName")}</p>
              <p className="text-lg font-medium">{data?.displayName ?? userName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issues</p>
              <p className="text-lg font-medium">{filteredItems.length}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="hidden grid-cols-[0.5fr_0.8fr_0.6fr_2fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-border bg-secondary px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground md:grid">
              <span>#</span>
              <span>{t("columns.issue")}</span>
              <span>{t("columns.hours")}</span>
              <span>{t("columns.subject")}</span>
              <span>Assignee</span>
              <span>{t("columns.status")}</span>
              <span>Start</span>
              <span>Due</span>
            </div>
            <div className="divide-y divide-border">
              {filteredItems.map((item, index) => {
                const issueId = item.issueId;
                return (
                  <div key={item.issueKey} className="grid gap-2 px-4 py-3 text-sm transition hover:bg-card md:grid-cols-[0.5fr_0.8fr_0.6fr_2fr_1fr_0.8fr_0.8fr_0.8fr] md:items-center">
                    <div className="text-muted-foreground">{index + 1}</div>
                    <div>
                      <a href={getIssueUrl(issueId)} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 hover:underline">
                        {item.issueKey}
                      </a>
                    </div>
                    <div className="text-muted-foreground tabular-nums">{item.hoursLogged}h</div>
                    <div className="text-foreground"><SearchHighlight text={item.subject} term={searchTerm} /></div>
                    <div className="text-muted-foreground"><SearchHighlight text={item.assigneeName ?? "-"} term={searchTerm} /></div>
                    <div>
                      <span className="inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs text-card-foreground">
                        <SearchHighlight text={item.status} term={searchTerm} />
                      </span>
                    </div>
                    <div className="text-muted-foreground">{formatDisplayDate(item.startDate)}</div>
                    <div className={item.dueDate && new Date(item.dueDate) < new Date() ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}>
                      {formatDisplayDate(item.dueDate)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
