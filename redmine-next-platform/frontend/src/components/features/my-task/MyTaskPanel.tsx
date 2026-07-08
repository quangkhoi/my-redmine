"use client";

import { useState } from "react";
import { useMyTask } from "@/hooks/queries/useMyTask";
import { useTranslations } from "next-intl";
import { ASSIGNEES } from "@/config/team";
import { getIssueUrl } from "@/lib/issue-url";
import { getHighlightClass } from "@/lib/highlight";
import { getMondayOfWeek, getNextFriday, formatDate, formatDisplayDate } from "@/lib/date-utils";

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

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">{description}</p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">User</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60"
          >
            {ASSIGNEES.map((a) => (
              <option key={a.login} value={a.login}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60" />
        </div>
      </div>

      {/* States */}
      {state.kind === "loading" && <p className="mt-4 text-slate-300">{t("loading")}</p>}
      {state.kind === "error" && <p className="mt-4 text-rose-300">{state.message}</p>}
      {state.kind === "empty" && <p className="mt-4 text-slate-300">{t("empty")}</p>}

      {state.kind === "ready" && data && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="hidden grid-cols-[0.5fr_0.8fr_1.5fr_2fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 border-b border-white/10 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
            <span>#</span>
            <span>{t("columns.issue")}</span>
            <span>Project</span>
            <span>{t("columns.subject")}</span>
            <span>{t("columns.status")}</span>
            <span>Start</span>
            <span>Due</span>
            <span>Progress</span>
          </div>
          <div className="divide-y divide-white/10">
            {data.items.map((item, index) => {
              const highlightClass = getHighlightClass(item.status, item.trackerName, item.dueDate, item.startDate);
              const issueId = parseInt(item.issueKey.replace("#", ""), 10);
              return (
                <div key={item.issueKey} className={`grid gap-2 px-4 py-3 text-sm transition hover:bg-white/[0.04] md:grid-cols-[0.5fr_0.8fr_1.5fr_2fr_0.8fr_0.8fr_0.8fr_0.6fr] md:items-center ${highlightClass}`}>
                  <div className="text-slate-400">{index + 1}</div>
                  <div>
                    <a href={getIssueUrl(issueId)} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200 hover:underline">
                      {item.issueKey}
                    </a>
                  </div>
                  <div className="text-slate-300">{item.projectName ?? "-"}</div>
                  <div className="text-white">{item.subject}</div>
                  <div>
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-slate-300">{formatDisplayDate(item.startDate)}</div>
                  <div className={item.dueDate && new Date(item.dueDate) < new Date() ? "text-red-400 font-medium" : "text-slate-300"}>
                    {formatDisplayDate(item.dueDate)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 overflow-hidden rounded-full bg-slate-700">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(0, Math.min(100, item.doneRatio))}%` }} />
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
