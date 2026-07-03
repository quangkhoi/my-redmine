import { API_BASE_URL } from "@/constants/api";
import { normalizeApiError } from "@/lib/http/normalizeApiError";
import type { LogTimeApiResponse, LogTimeViewModel } from "@/types/api/log-time";

type ApiResult = { kind: "ok"; data: LogTimeViewModel } | { kind: "error"; message: string };

export async function getLogTime(reportDate: string, userName: string): Promise<ApiResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/log-time/${encodeURIComponent(reportDate)}/${encodeURIComponent(userName)}`);
    if (!response.ok) {
      return { kind: "error", message: normalizeApiError(response.status) };
    }

    const payload = (await response.json()) as LogTimeApiResponse;
    return { kind: "ok", data: payload };
  } catch {
    return { kind: "error", message: "Network error." };
  }
}
