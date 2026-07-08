import { isDueTodayOrPast, isStartDateTodayOrPast, isStartDateBeyondThreshold } from "./date-utils";

export function getProcessingHighlightClass(dueDate: string | null): string {
  if (isDueTodayOrPast(dueDate)) return "bg-red-900/20";
  return "";
}

export function getNotStartedHighlightClass(trackerName: string | null, startDate: string | null): string {
  if (isStartDateTodayOrPast(startDate)) {
    if (trackerName === "開発") return "bg-red-900/20";
    return "bg-red-900/20";
  }
  if (isStartDateBeyondThreshold(startDate)) return "bg-green-900/20";
  return "";
}

export function getHighlightClass(
  statusName: string | null,
  trackerName: string | null,
  dueDate: string | null,
  startDate: string | null
): string {
  if (statusName === "処理中") return getProcessingHighlightClass(dueDate);
  if (statusName === "未対応") return getNotStartedHighlightClass(trackerName, startDate);
  return "";
}
