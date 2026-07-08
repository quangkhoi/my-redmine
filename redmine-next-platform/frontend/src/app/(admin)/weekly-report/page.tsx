import type { Metadata } from "next";
import { WeeklyReportPanel } from "@/components/features/weekly-report/WeeklyReportPanel";

export const metadata: Metadata = {
  title: "Weekly Report - WDM Redmine Dashboard",
};

export default function Page() {
  return <WeeklyReportPanel />;
}
