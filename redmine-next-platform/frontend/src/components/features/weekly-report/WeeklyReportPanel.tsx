"use client";

import { useTranslations } from "next-intl";
import { useWeeklyReport } from "@/hooks/queries/useWeeklyReport";

type Props = {
  weekStart: string;
  userName: string;
};

export function WeeklyReportPanel({ weekStart, userName }: Props) {
  const t = useTranslations("weeklyReport");
  const { data, state } = useWeeklyReport(weekStart, userName);

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-violet-300">{t("eyebrow")}</p>
      <h2 className="mt-4 text-3xl font-semibold">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">{t("description")}</p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
        {state.kind === "loading" && <p className="text-slate-300">{t("loading")}</p>}
        {state.kind === "error" && <p className="text-rose-300">{state.message}</p>}
        {state.kind === "empty" && <p className="text-slate-300">{t("empty")}</p>}
        {state.kind === "ready" && data && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-slate-400">Range</p>
                <p className="text-lg font-medium">{data.range.from} - {data.range.to}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Export</p>
                <p className="text-lg font-medium">{data.exportRange.from} - {data.exportRange.to}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">{t("userName")}</p>
                <p className="text-lg font-medium">{data.userName}</p>
              </div>
            </div>

            <div className="space-y-6">
              {data.sections.map((section) => (
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
                        <div className="text-sky-300">{item.issueKey}</div>
                        <div className="text-slate-300">{item.projectName || "-"}</div>
                        <div className="text-white">{item.subject}</div>
                        <div>
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                            {item.status}
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
      </div>
    </section>
  );
}
