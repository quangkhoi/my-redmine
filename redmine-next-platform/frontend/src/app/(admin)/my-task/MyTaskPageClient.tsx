"use client";

import { MyTaskPanel } from "@/components/features/my-task/MyTaskPanel";
import { useTranslations } from "next-intl";

export function MyTaskPageClient() {
  const t = useTranslations("myTask");

  return <MyTaskPanel eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />;
}
