"use client";

import { useMyTask } from "@/hooks/queries/useMyTask";
import { useTranslations } from "next-intl";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export function MyTaskPanel({ eyebrow, title, description }: Props) {
  const t = useTranslations("myTask");
  const { data, state } = useMyTask("alice");

  return (
    <section className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">{description}</p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
        {state.kind === "loading" && <p className="text-slate-300">{t("loading")}</p>}
        {state.kind === "error" && <p className="text-rose-300">{state.message}</p>}
        {state.kind === "empty" && <p className="text-slate-300">{t("empty")}</p>}
        {state.kind === "ready" && data && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-slate-400">{t("assignedTo")}</p>
                <p className="text-lg font-medium">{data.displayName}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="hidden grid-cols-[1fr_2fr_0.8fr] gap-4 border-b border-white/10 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
                <span>{t("columns.issue")}</span>
                <span>{t("columns.subject")}</span>
                <span>{t("columns.status")}</span>
              </div>
              <div className="divide-y divide-white/10">
                {data.items.map((item) => (
                  <div
                    key={item.issueKey}
                    className="grid gap-2 px-4 py-3 text-sm transition hover:bg-white/[0.04] md:grid-cols-[1fr_2fr_0.8fr] md:items-center"
                  >
                    <div className="text-sky-300">{item.issueKey}</div>
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
          </div>
        )}
      </div>
    </section>
  );
}
