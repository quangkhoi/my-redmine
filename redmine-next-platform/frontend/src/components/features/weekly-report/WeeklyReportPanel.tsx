"use client";

import { useState, useMemo, useCallback } from "react";
import { useWeeklyReport } from "@/hooks/queries/useWeeklyReport";
import { useSearch } from "@/contexts/SearchContext";
import { useTranslations } from "next-intl";
import { getIssueUrl } from "@/lib/issue-url";
import { getMondayOfWeek, formatDate } from "@/lib/date-utils";
import { filterBySearch, buildSearchText } from "@/lib/search";
import { SearchHighlight } from "@/components/ui/SearchHighlight";

function formatExcelDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

const COLUMN_HEADERS = ["No", "クライアント名", "チケットID", "タイトル", "課題", "ステータス", "開始日", "終了日"];

type SectionKey = "prevCsharp" | "prevWeb" | "currentCsharp" | "currentWeb";

interface SectionConfig {
  key: SectionKey;
  teamTitle: string;
  isSectionStart: boolean;
  sectionTitle: string;
}

function buildSectionConfigs(hasPrevious: boolean): SectionConfig[] {
  const configs: SectionConfig[] = [];
  if (hasPrevious) {
    configs.push({ key: "prevCsharp", teamTitle: "C#開発", isSectionStart: true, sectionTitle: "■先週の作業" });
    configs.push({ key: "prevWeb", teamTitle: "WEB開発", isSectionStart: false, sectionTitle: "" });
  }
  configs.push({ key: "currentCsharp", teamTitle: "C#開発", isSectionStart: true, sectionTitle: "◆今週の計画" });
  configs.push({ key: "currentWeb", teamTitle: "WEB開発", isSectionStart: false, sectionTitle: "" });
  return configs;
}

export function WeeklyReportPanel() {
  const t = useTranslations("weeklyReport");
  const [weekStart, setWeekStart] = useState(() => formatDate(getMondayOfWeek(new Date())));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const sectionConfigs = useMemo(
    () => (data ? buildSectionConfigs(data.hasPrevious) : []),
    [data],
  );

  const sectionMap = useMemo(() => {
    const map = new Map<string, typeof filteredSections[number]>();
    for (const s of filteredSections) map.set(s.key, s);
    return map;
  }, [filteredSections]);

  const allIssueKeys = useMemo(() => {
    const keys: string[] = [];
    for (const cfg of sectionConfigs) {
      const section = sectionMap.get(cfg.key);
      if (section) {
        for (const item of section.items) {
          keys.push(`${cfg.key}-${item.issueId}`);
        }
      }
    }
    return keys;
  }, [sectionConfigs, sectionMap]);

  const allSelected = allIssueKeys.length > 0 && allIssueKeys.every((k) => selectedIds.has(k));

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (allSelected) return new Set();
      return new Set(allIssueKeys);
    });
  }, [allSelected, allIssueKeys]);

  const toggleRow = useCallback((key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isRowSelected = useCallback(
    (key: string) => selectedIds.size === 0 || selectedIds.has(key),
    [selectedIds],
  );

  const handleExport = useCallback(async () => {
    if (!data) return;

    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const rows: (string | number | { text: string | number; hyperlink: string })[][] = [];

    const rangeFrom = new Date(data.exportRange.from);
    const rangeTo = new Date(data.exportRange.to);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const title = `週報（${rangeFrom.getFullYear()}年${rangeFrom.getMonth() + 1}月${rangeFrom.getDate()}日〜${rangeTo.getFullYear()}年${rangeTo.getMonth() + 1}月${rangeTo.getDate()}日）`;
    rows.push([title]);
    rows.push([]);

    let rowNum = 0;
    for (const cfg of sectionConfigs) {
      const section = sectionMap.get(cfg.key);
      const items = section?.items ?? [];
      const selected = items.filter((item) => {
        const key = `${cfg.key}-${item.issueId}`;
        return selectedIds.size === 0 || selectedIds.has(key);
      });

      if (selected.length === 0) continue;

      if (cfg.isSectionStart) {
        rows.push([cfg.sectionTitle]);
        rows.push([]);
      }
      rows.push([cfg.teamTitle]);
      rows.push([...COLUMN_HEADERS]);

      const exportItems = selected;
      for (const item of exportItems) {
        rowNum++;
        if (!item) {
          rows.push([rowNum, "", "", "", "", "", "", ""]);
        } else {
          rows.push([
            rowNum,
            item.projectName || "",
            { text: item.issueId, hyperlink: getIssueUrl(item.issueId) },
            item.subject || "",
            "",
            item.status || "",
            formatExcelDate(item.startDate),
            formatExcelDate(item.dueDate),
          ]);
        }
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

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    const monthDayRange = `${pad2(rangeFrom.getMonth() + 1)}.${pad2(rangeFrom.getDate())}~${pad2(rangeTo.getMonth() + 1)}.${pad2(rangeTo.getDate())}`;
    XLSX.writeFile(wb, `WDM_Weekly_Report_${monthDayRange}.xlsx`);
  }, [data, sectionConfigs, sectionMap, selectedIds]);

  return (
    <section className="w-full rounded-3xl border border-border bg-secondary p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-violet-600 dark:text-violet-300">{t("eyebrow")}</p>
      <h2 className="mt-4 text-3xl font-semibold">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("description")}</p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Week Start (Monday)</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-sky-400/60"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={state.kind !== "ready"}
          className="rounded-xl border border-border bg-secondary px-4 py-2 text-sm text-card-foreground transition hover:border-white/20 hover:bg-secondary/80 disabled:opacity-50"
        >
          Export Excel
        </button>
      </div>

      {/* States */}
      {state.kind === "loading" && <p className="mt-4 text-muted-foreground">{t("loading")}</p>}
      {state.kind === "error" && <p className="mt-4 text-rose-300">{state.message}</p>}
      {state.kind === "empty" && <p className="mt-4 text-muted-foreground">{t("empty")}</p>}

      {state.kind === "ready" && data && (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Range</p>
              <p className="text-lg font-medium">{data.range.from} - {data.range.to}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("userName")}</p>
              <p className="text-lg font-medium">{data.userName}</p>
            </div>
          </div>

          {/* Report table */}
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="report-table w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-3 py-3 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <label className="report-selection-control cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                      />
                      <span>No</span>
                    </label>
                  </th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">クライアント名</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">チケットID</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">タイトル</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">課題</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">ステータス</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">開始日</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">終了日</th>
                </tr>
              </thead>
              <tbody>
                {sectionConfigs.map((cfg) => {
                  const section = sectionMap.get(cfg.key);
                  const items = section?.items ?? [];

                  const rows: React.ReactNode[] = [];

                  if (cfg.isSectionStart) {
                    rows.push(
                      <tr key={`${cfg.key}-section`} className="report-section-row">
                        <td colSpan={8}>{cfg.sectionTitle}</td>
                      </tr>,
                    );
                  }

                  rows.push(
                    <tr key={`${cfg.key}-team`} className="report-team-row">
                      <td colSpan={8}>{cfg.teamTitle}</td>
                    </tr>,
                  );

                  if (items.length === 0) {
                    rows.push(
                      <tr key={`${cfg.key}-empty`}>
                        <td colSpan={8} className="px-4 py-3 text-muted-foreground">No issues.</td>
                      </tr>,
                    );
                  } else {
                    items.forEach((item, index) => {
                      const rowKey = `${cfg.key}-${item.issueId}`;
                      const selected = isRowSelected(rowKey);
                      rows.push(
                        <tr
                          key={rowKey}
                          className={!selected ? "report-row-excluded" : ""}
                        >
                          <td className="text-center">
                            <label className="report-selection-control cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedIds.size === 0 || selectedIds.has(rowKey)}
                                onChange={() => toggleRow(rowKey)}
                              />
                              <span>{index + 1}</span>
                            </label>
                          </td>
                          <td><SearchHighlight text={item.projectName || ""} term={searchTerm} /></td>
                          <td>
                            <a
                              href={getIssueUrl(item.issueId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="issue-link text-sky-300 hover:text-sky-200 hover:underline"
                            >
                              <SearchHighlight text={item.issueKey} term={searchTerm} />
                            </a>
                          </td>
                          <td><SearchHighlight text={item.subject || ""} term={searchTerm} /></td>
                          <td></td>
                          <td>
                            <span className="inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-xs text-card-foreground">
                              <SearchHighlight text={item.status || "-"} term={searchTerm} />
                            </span>
                          </td>
                          <td>{formatExcelDate(item.startDate) || "-"}</td>
                          <td>{formatExcelDate(item.dueDate) || "-"}</td>
                        </tr>,
                      );
                    });
                  }

                  return rows;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
