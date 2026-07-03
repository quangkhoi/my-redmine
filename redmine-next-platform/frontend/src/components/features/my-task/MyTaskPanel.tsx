"use client";

import { useMyTask } from "@/hooks/queries/useMyTask";
import { useTranslations } from "next-intl";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export function MyTaskPanel({ eyebrow, title, description }: Props) {
  const t = useTranslations("home");
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
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">{t("assignedTo")}</p>
              <p className="text-lg font-medium">{data.displayName}</p>
            </div>
            <ul className="space-y-3">
              {data.items.map((item) => (
                <li key={item.issueKey} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.issueKey}</p>
                      <p className="text-sm text-slate-300">{item.subject}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                      {item.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
