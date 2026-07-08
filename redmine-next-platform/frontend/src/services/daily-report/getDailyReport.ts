import { API_BASE_URL } from "@/constants/api";
import { normalizeApiError } from "@/lib/http/normalizeApiError";
import { toDailyReportViewModel, type DailyReportApiResponse, type DailyReportViewModel } from "@/types/api/daily-report";

type ApiResult = { kind: "ok"; data: DailyReportViewModel } | { kind: "error"; message: string };

export async function getDailyReport(reportDate: string, userName: string): Promise<ApiResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily-report/${encodeURIComponent(reportDate)}/${encodeURIComponent(userName)}`);
    if (!response.ok) {
      return { kind: "error", message: normalizeApiError(response.status) };
    }

    const payload = (await response.json()) as DailyReportApiResponse;
    return { kind: "ok", data: toDailyReportViewModel(payload) };
  } catch {
    return { kind: "error", message: "Network error." };
  }
}
