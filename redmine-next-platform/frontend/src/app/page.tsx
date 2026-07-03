import { MyTaskPanel } from "@/components/features/my-task/MyTaskPanel";
import { DailyReportPanel } from "@/components/features/daily-report/DailyReportPanel";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("home");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
        <div className="space-y-8">
          <MyTaskPanel eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
          <DailyReportPanel reportDate="2026-07-03" userName="alice" />
        </div>
      </div>
    </main>
  );
}
