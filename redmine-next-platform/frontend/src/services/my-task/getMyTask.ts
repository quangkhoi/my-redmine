import { normalizeApiError } from "@/lib/http/normalizeApiError";
import { API_BASE_URL } from "@/constants/api";
import type { MyTaskApiResponse, MyTaskViewModel } from "@/types/api/my-task";

type ApiResult = { kind: "ok"; data: MyTaskViewModel } | { kind: "error"; message: string };

export async function getMyTask(
  userName: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResult> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    const url = `${API_BASE_URL}/api/my-task/${encodeURIComponent(userName)}${qs ? `?${qs}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { kind: "error", message: normalizeApiError(response.status) };
    }

    const payload = (await response.json()) as MyTaskApiResponse;
    return {
      kind: "ok",
      data: {
        userName: payload.userName,
        displayName: payload.displayName,
        items: payload.items
      }
    };
  } catch {
    return { kind: "error", message: "Network error." };
  }
}
