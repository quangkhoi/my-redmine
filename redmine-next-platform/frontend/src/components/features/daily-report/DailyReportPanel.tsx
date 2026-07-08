"use client";

import { useState, useCallback, useRef } from "react";
import { useDailyReport } from "@/hooks/queries/useDailyReport";
import { useTranslations } from "next-intl";
import { getIssueUrl } from "@/lib/issue-url";
import { formatDate } from "@/lib/date-utils";
import { CIRCLED_NUMBERS } from "@/config/issue-filters";

function getCircledNumber(index: number): string {
  if (index < CIRCLED_NUMBERS.length) return CIRCLED_NUMBERS[index];
  return `${index + 1}.`;
}

function buildClipboardText(groups: Array<{ label: string; items: Array<{ issueKey: string; subject: string; issueId: number }> }>): string {
  const lines: string[] = [];
  lines.push("お疲れ様です。");
  const now = new Date();
  lines.push(`${now.getMonth() + 1}月${now.getDate()}日の対応予定を報告いたします。`);
  lines.push("");

  for (const group of groups) {
    if (group.items.length === 0) continue;
    lines.push(`■${group.label}`);
    group.items.forEach((item, i) => {
      lines.push(`${getCircledNumber(i)}${item.subject} - https://redmine.wdm.co.jp/issues/${item.issueId}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

export function DailyReportPanel() {
  const t = useTranslations("dailyReport");
  const [reportDate, setReportDate] = useState(formatDate(new Date()));
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, state } = useDailyReport(reportDate, "tuyennguyen");

  const handleCopy = useCallback(async () => {
    if (!data) return;
    const text = buildClipboardText(data.groups);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: textarea
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data]);

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
        <div ref={contentRef} className="mt-6 space-y-5">
          {data.groups.map((group) => (
            <div key={group.key} className="overflow-hidden rounded-2xl border border-white/10">
              <div className="border-b border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-slate-200">
                {group.label}
              </div>
              <div className="hidden grid-cols-[0.5fr_1fr_2.5fr_1fr] gap-4 border-b border-white/10 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
                <span>#</span>
                <span>{t("columns.issue")}</span>
                <span>{t("columns.subject")}</span>
                <span>{t("columns.status")}</span>
              </div>
              <div className="divide-y divide-white/10">
                {group.items.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-400">No issues.</div>
                )}
                {group.items.map((item, index) => (
                  <div key={item.issueId} className="grid gap-2 px-4 py-3 text-sm transition hover:bg-white/[0.04] md:grid-cols-[0.5fr_1fr_2.5fr_1fr] md:items-center">
                    <div className="text-slate-400">{getCircledNumber(index)}</div>
                    <div>
                      <a href={getIssueUrl(item.issueId)} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200 hover:underline">
                        {item.issueKey}
                      </a>
                    </div>
                    <div className="text-white">{item.subject}</div>
                    <div>
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
