import { API_BASE_URL } from "@/constants/api";
import { normalizeApiError } from "@/lib/http/normalizeApiError";
import type { DashboardApiResponse, DashboardViewModel } from "@/types/api/dashboard";

type ApiResult = { kind: "ok"; data: DashboardViewModel } | { kind: "error"; message: string };

export async function getDashboard(reportDate: string, userName: string): Promise<ApiResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/${encodeURIComponent(reportDate)}/${encodeURIComponent(userName)}`);
    if (!response.ok) {
      return { kind: "error", message: normalizeApiError(response.status) };
    }

    const payload = (await response.json()) as DashboardApiResponse;
    return { kind: "ok", data: payload };
  } catch {
    return { kind: "error", message: "Network error." };
  }
}
