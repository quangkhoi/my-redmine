"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useDailyReport } from "@/hooks/queries/useDailyReport";
import { useSearch } from "@/contexts/SearchContext";
import { useTranslations } from "next-intl";
import { getIssueUrl } from "@/lib/issue-url";
import { formatDate } from "@/lib/date-utils";
import { CIRCLED_NUMBERS } from "@/config/issue-filters";
import { filterBySearch, buildSearchText } from "@/lib/search";
import { SearchHighlight } from "@/components/ui/SearchHighlight";

function getCircledNumber(index: number): string {
  if (index < CIRCLED_NUMBERS.length) return CIRCLED_NUMBERS[index];
  return `${index + 1}.`;
}

function buildReportHtml(
  groups: Array<{ label: string; items: Array<{ issueId: number; subject: string; projectName: string | null }> }>,
  otherGroup: { label: string; items: Array<{ issueId: number; subject: string; projectName: string | null }> } | null,
  reportDate: string,
): string {
  const dateObj = new Date(reportDate);
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();

  const lines: string[] = [];
  lines.push("お疲れ様です。");
  lines.push(`${month}月${day}日の対応予定を報告いたします。`);
  lines.push("");

  for (const group of groups) {
    if (group.items.length === 0) continue;
    lines.push(`■${group.label}`);
    group.items.forEach((item, i) => {
      const number = getCircledNumber(i);
      const url = getIssueUrl(item.issueId);
      const displayText = `${item.subject || "-"} - ${item.projectName || "-"}`;
      lines.push(`${number}<a href="${url}" target="_blank" rel="noreferrer">${displayText}</a>`);
    });
    lines.push("");
  }

  if (otherGroup && otherGroup.items.length > 0) {
    lines.push("", `■${otherGroup.label}`);
    otherGroup.items.forEach((item, i) => {
      const number = getCircledNumber(i);
      const url = getIssueUrl(item.issueId);
      const displayText = `${item.subject || "-"} - ${item.projectName || "-"}`;
      lines.push(`${number}<a href="${url}" target="_blank" rel="noreferrer">${displayText}</a>`);
    });
  }

  return lines.join("\n");
}

function buildClipboardPlainText(
  groups: Array<{ label: string; items: Array<{ issueId: number; subject: string; projectName: string | null }> }>,
  otherGroup: { label: string; items: Array<{ issueId: number; subject: string; projectName: string | null }> } | null,
  reportDate: string,
): string {
  const dateObj = new Date(reportDate);
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();

  const lines: string[] = [];
  lines.push("お疲れ様です。");
  lines.push(`${month}月${day}日の対応予定を報告いたします。`);
  lines.push("");

  for (const group of groups) {
    if (group.items.length === 0) continue;
    lines.push(`■${group.label}`);
    group.items.forEach((item, i) => {
      const number = getCircledNumber(i);
      const url = getIssueUrl(item.issueId);
      const displayText = `${item.subject || "-"} - ${item.projectName || "-"}`;
      lines.push(`${number}${displayText} ${url}`);
    });
    lines.push("");
  }

  if (otherGroup && otherGroup.items.length > 0) {
    lines.push("", `■${otherGroup.label}`);
    otherGroup.items.forEach((item, i) => {
      const number = getCircledNumber(i);
      const url = getIssueUrl(item.issueId);
      const displayText = `${item.subject || "-"} - ${item.projectName || "-"}`;
      lines.push(`${number}${displayText} ${url}`);
    });
  }

  return lines.join("\n");
}

export function DailyReportPanel() {
  const t = useTranslations("dailyReport");
  const [reportDate, setReportDate] = useState(formatDate(new Date()));
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, state } = useDailyReport(reportDate, "tuyennguyen");
  const { searchTerm } = useSearch();

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    if (!searchTerm) return data.groups.filter((g) => g.key !== "other");
    return data.groups
      .filter((g) => g.key !== "other")
      .map((group) => ({
        ...group,
        items: filterBySearch(group.items, searchTerm, (i) =>
          buildSearchText(i.issueId, i.issueKey, i.subject, i.status),
        ),
      }));
  }, [data, searchTerm]);

  const otherGroup = useMemo(() => {
    if (!data) return null;
    const other = data.groups.find((g) => g.key === "other");
    if (!other) return null;
    if (!searchTerm) return other;
    return {
      ...other,
      items: filterBySearch(other.items, searchTerm, (i) =>
        buildSearchText(i.issueId, i.issueKey, i.subject, i.status),
      ),
    };
  }, [data, searchTerm]);

  const handleCopy = useCallback(async () => {
    if (!data) return;
    const htmlContent = buildReportHtml(filteredGroups, otherGroup, reportDate);
    const html = `<div style="white-space: pre-wrap; font-family: sans-serif;">${htmlContent}</div>`;
    const text = buildClipboardPlainText(filteredGroups, otherGroup, reportDate);

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        if (selection && contentRef.current && range.selectNodeContents) {
          selection.removeAllRanges();
          range.selectNodeContents(contentRef.current);
          selection.addRange(range);
          document.execCommand("copy");
          selection.removeAllRanges();
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data, filteredGroups, otherGroup, reportDate]);

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{t("eyebrow")}</p>
      <h2 className="mt-4 text-3xl font-semibold">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">{t("description")}</p>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Report Date</label>
          <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60" />
        </div>
        <button onClick={handleCopy} disabled={state.kind !== "ready"}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-50">
          {copied ? "✓ Copied!" : "Copy Report"}
        </button>
      </div>

      {/* States */}
      {state.kind === "loading" && <p className="mt-4 text-slate-300">{t("loading")}</p>}
      {state.kind === "error" && <p className="mt-4 text-rose-300">{state.message}</p>}
      {state.kind === "empty" && <p className="mt-4 text-slate-300">{t("empty")}</p>}

      {state.kind === "ready" && data && (
        <div ref={contentRef} className="mt-6 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-6 font-sans text-sm leading-relaxed text-slate-200">
          <p>お疲れ様です。</p>
          <p>{new Date(reportDate).getMonth() + 1}月{new Date(reportDate).getDate()}日の対応予定を報告いたします。</p>
          <p>&nbsp;</p>
          {filteredGroups.map((group) =>
            group.items.length > 0 && (
              <div key={group.key}>
                <p className="mt-2 font-medium text-white">■{group.label}</p>
                {group.items.map((item, index) => (
                  <p key={item.issueId}>
                    {getCircledNumber(index)}
                    <a href={getIssueUrl(item.issueId)} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200 hover:underline">
                      <SearchHighlight text={item.subject || "-"} term={searchTerm} /> - <SearchHighlight text={item.projectName || "-"} term={searchTerm} />
                    </a>
                  </p>
                ))}
              </div>
            ),
          )}
          {otherGroup && otherGroup.items.length > 0 && (
            <div>
              <p>&nbsp;</p>
              <p className="mt-2 font-medium text-white">■{otherGroup.label}</p>
              {otherGroup.items.map((item, index) => (
                <p key={item.issueId}>
                  {getCircledNumber(index)}
                  <a href={getIssueUrl(item.issueId)} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200 hover:underline">
                    <SearchHighlight text={item.subject || "-"} term={searchTerm} /> - <SearchHighlight text={item.projectName || "-"} term={searchTerm} />
                  </a>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
