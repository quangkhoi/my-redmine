import type { Metadata } from "next";
import { LogTimePanel } from "@/components/features/login-time/LogTimePanel";

export const metadata: Metadata = {
  title: "Log Time - WDM Redmine Dashboard",
};

export default function Page() {
  return <LogTimePanel reportDate="" userName="tuyennguyen" />;
}
