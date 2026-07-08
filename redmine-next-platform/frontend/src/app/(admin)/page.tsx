import type { Metadata } from "next";
import { DashboardIssuesPanel } from "@/components/features/dashboard/DashboardIssuesPanel";

export const metadata: Metadata = {
  title: "Dashboard - WDM Redmine Dashboard",
};

export default function Page() {
  return <DashboardIssuesPanel />;
}
