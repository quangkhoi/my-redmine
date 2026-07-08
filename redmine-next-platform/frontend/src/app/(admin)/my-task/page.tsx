import type { Metadata } from "next";
import { MyTaskPageClient } from "./MyTaskPageClient";

export const metadata: Metadata = {
  title: "My Task - WDM Redmine Dashboard",
};

export default function Page() {
  return <MyTaskPageClient />;
}
