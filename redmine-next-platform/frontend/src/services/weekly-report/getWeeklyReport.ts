import { API_BASE_URL } from "@/constants/api";
import { normalizeApiError } from "@/lib/http/normalizeApiError";
import type { WeeklyReportApiResponse, WeeklyReportViewModel } from "@/types/api/weekly-report";

type ApiResult = { kind: "ok"; data: WeeklyReportViewModel } | { kind: "error"; message: string };

export async function getWeeklyReport(weekStart: string, userName: string): Promise<ApiResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/weekly-report/${encodeURIComponent(weekStart)}/${encodeURIComponent(userName)}`);
    if (!response.ok) {
      return { kind: "error", message: normalizeApiError(response.status) };
    }

    const payload = (await response.json()) as WeeklyReportApiResponse;
    return { kind: "ok", data: payload };
  } catch {
    return { kind: "error", message: "Network error." };
  }
}
