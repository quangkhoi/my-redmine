"use client";

import { useState, useMemo, useCallback } from "react";
import { useWeeklyReport } from "@/hooks/queries/useWeeklyReport";
import { useSearch } from "@/contexts/SearchContext";
import { useTranslations } from "next-intl";
import { getIssueUrl } from "@/lib/issue-url";
import { getMondayOfWeek, formatDate } from "@/lib/date-utils";
import { filterBySearch, buildSearchText } from "@/lib/search";
import { SearchHighlight } from "@/components/ui/SearchHighlight";

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

function formatExportDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function WeeklyReportPanel() {
  const t = useTranslations("weeklyReport");
  const [weekStart, setWeekStart] = useState(() => formatDate(getMondayOfWeek(new Date())));

  const { data, state } = useWeeklyReport(weekStart, "tuyennguyen");
  const { searchTerm } = useSearch();

  const filteredSections = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data.sections;
    return data.sections.map(section => ({
      ...section,
      items: filterBySearch(section.items, searchTerm, (i) =>
        buildSearchText(i.issueId, i.issueKey, i.subject, i.projectName, i.status, i.trackerName)
      ),
    }));
  }, [data, searchTerm]);

  const handleExport = useCallback(async () => {
    if (!data) return;

    const XLSX = await import("xlsx");

    const wb = XLSX.utils.book_new();

    const rows: (string | number)[][] = [];

    const rangeFrom = new Date(data.exportRange.from);
    const rangeTo = new Date(data.exportRange.to);
    const title = `週報（${rangeFrom.getFullYear()}年${rangeFrom.getMonth() + 1}月${rangeFrom.getDate()}日〜${rangeTo.getFullYear()}年${rangeTo.getMonth() + 1}月${rangeTo.getDate()}日）`;
    rows.push([title]);
    rows.push([]);

    const sectionHeaders = [
      { key: "prevCsharp" as const, sectionTitle: "■先週の作業", teamTitle: "C#開発" },
      { key: "prevWeb" as const, sectionTitle: "", teamTitle: "WEB開発" },
      { key: "currentCsharp" as const, sectionTitle: "◆今週の計画", teamTitle: "C#開発" },
      { key: "currentWeb" as const, sectionTitle: "", teamTitle: "WEB開発" },
    ];

    let rowNum = 0;
    for (const section of sectionHeaders) {
      const items = data.sections.find((s) => s.key === section.key)?.items ?? [];
      if (items.length === 0) continue;

      if (section.sectionTitle) {
        rows.push([section.sectionTitle]);
        rows.push([]);
      }
      rows.push([section.teamTitle]);
      rows.push(["No", "クライアント名", "チケットID", "タイトル", "課題", "ステータス", "開始日", "終了日"]);

      for (const item of items) {
        rowNum++;
        rows.push([
          rowNum,
          item.projectName || "-",
          item.issueKey,
          item.subject,
          "",
          item.status,
          item.startDate ? formatExportDate(item.startDate) : "-",
          item.dueDate ? formatExportDate(item.dueDate) : "-",
        ]);
      }
      rows.push([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws["!cols"] = [
      { wch: 4.5 },
      { wch: 18 },
      { wch: 12 },
      { wch: 45 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];

    let r = 2;
    for (const section of sectionHeaders) {
      const items = data.sections.find((s) => s.key === section.key)?.items ?? [];
      if (items.length === 0) continue;
      if (section.sectionTitle) r += 2;
      r += 2;
      for (const item of items) {
        const cellRef = XLSX.utils.encode_cell({ r, c: 2 });
        if (ws[cellRef]) {
          ws[cellRef].l = { Target: getIssueUrl(item.issueId) };
        }
        r++;
      }
      r++;
    }

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    const monthDayRange = `${String(rangeFrom.getMonth() + 1).padStart(2, "0")}.${String(rangeFrom.getDate()).padStart(2, "0")}~${String(rangeTo.getMonth() + 1).padStart(2, "0")}.${String(rangeTo.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(wb, `WDM_Weekly_Report_${monthDayRange}.xlsx`);
  }, [data]);

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-violet-300">{t("eyebrow")}</p>
      <h2 className="mt-4 text-3xl font-semibold">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">{t("description")}</p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Week Start (Monday)</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={state.kind !== "ready"}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
        >
          Export Excel
        </button>
      </div>

      {/* States */}
      {state.kind === "loading" && <p className="mt-4 text-slate-300">{t("loading")}</p>}
      {state.kind === "error" && <p className="mt-4 text-rose-300">{state.message}</p>}
      {state.kind === "empty" && <p className="mt-4 text-slate-300">{t("empty")}</p>}

      {state.kind === "ready" && data && (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-slate-400">Range</p>
              <p className="text-lg font-medium">{data.range.from} - {data.range.to}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">{t("userName")}</p>
              <p className="text-lg font-medium">{data.userName}</p>
            </div>
          </div>

          <div className="space-y-6">
            {filteredSections.map((section) => (
              <div key={section.key} className="overflow-hidden rounded-2xl border border-white/10">
                <div className="border-b border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-slate-200">
                  {section.title}
                </div>
                <div className="hidden grid-cols-[0.9fr_1fr_2fr_0.9fr_0.7fr] gap-4 border-b border-white/10 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
                  <span>{t("columns.issue")}</span>
                  <span>Project</span>
                  <span>{t("columns.subject")}</span>
                  <span>{t("columns.status")}</span>
                  <span>{t("columns.hours")}</span>
                </div>
                <div className="divide-y divide-white/10">
                  {section.items.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400">No issues.</div>
                  )}
                  {section.items.map((item) => (
                    <div key={`${section.key}-${item.issueId}`} className="grid gap-2 px-4 py-3 text-sm transition hover:bg-white/[0.04] md:grid-cols-[0.9fr_1fr_2fr_0.9fr_0.7fr] md:items-center">
                      <div>
                        <a
                          href={getIssueUrl(item.issueId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-300 hover:text-sky-200 hover:underline"
                        >
                          {item.issueKey}
                        </a>
                      </div>
                      <div className="text-slate-300"><SearchHighlight text={item.projectName || "-"} term={searchTerm} /></div>
                      <div className="text-white"><SearchHighlight text={item.subject} term={searchTerm} /></div>
                      <div>
                        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                          <SearchHighlight text={item.status} term={searchTerm} />
                        </span>
                      </div>
                      <div className="text-slate-300 tabular-nums">{item.reportSpentHours}h</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
