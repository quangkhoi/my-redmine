import { normalizeApiError } from "@/lib/http/normalizeApiError";
import { API_BASE_URL } from "@/constants/api";
import type { MyTaskApiResponse, MyTaskViewModel } from "@/types/api/my-task";

type ApiResult = { kind: "ok"; data: MyTaskViewModel } | { kind: "error"; message: string };

export async function getMyTask(userName: string): Promise<ApiResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/my-task/${encodeURIComponent(userName)}`);
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
