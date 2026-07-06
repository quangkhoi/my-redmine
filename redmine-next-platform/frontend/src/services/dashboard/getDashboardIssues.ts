import { API_BASE_URL } from "@/constants/api";
import { normalizeApiError } from "@/lib/http/normalizeApiError";
import type { DashboardIssuesApiResponse, DashboardIssuesViewModel } from "@/types/api/dashboard-issues";

type ApiResult = { kind: "ok"; data: DashboardIssuesViewModel } | { kind: "error"; message: string };

export async function getDashboardIssues(startDate: string, endDate: string): Promise<ApiResult> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await fetch(`${API_BASE_URL}/api/dashboard/issues?${params}`);
    if (!response.ok) {
      return { kind: "error", message: normalizeApiError(response.status) };
    }

    const payload = (await response.json()) as DashboardIssuesApiResponse;
    return { kind: "ok", data: payload };
  } catch {
    return { kind: "error", message: "Network error." };
  }
}
