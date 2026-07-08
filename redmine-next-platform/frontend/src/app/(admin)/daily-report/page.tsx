import type { Metadata } from "next";
import { DailyReportPanel } from "@/components/features/daily-report/DailyReportPanel";

export const metadata: Metadata = {
  title: "Daily Report - WDM Redmine Dashboard",
};

export default function Page() {
  return <DailyReportPanel />;
}
