"use client";

import { useDashboard } from "@/hooks/queries/useDashboard";
import { useTranslations } from "next-intl";

type Props = {
  reportDate: string;
  userName: string;
};

export function DashboardPanel({ reportDate, userName }: Props) {
  const t = useTranslations("dashboard");
  const { data, state } = useDashboard(reportDate, userName);

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-sky-300">{t("eyebrow")}</p>
      <h2 className="mt-4 text-3xl font-semibold">{t("title")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">{t("description")}</p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
        {state.kind === "loading" && <p className="text-slate-300">{t("loading")}</p>}
        {state.kind === "error" && <p className="text-rose-300">{state.message}</p>}
        {state.kind === "empty" && <p className="text-slate-300">{t("empty")}</p>}
        {state.kind === "ready" && data && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {data.metrics.map((metric, index) => (
                <div key={metric.code} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-400">{metric.label}</p>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">#{index + 1}</span>
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{metric.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-slate-500">{t("reportDate")}</p>
                  <p className="text-white">{data.reportDate}</p>
                </div>
                <div>
                  <p className="text-slate-500">{t("userName")}</p>
                  <p className="text-white">{data.userName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Metric count</p>
                  <p className="text-white">{data.metrics.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
