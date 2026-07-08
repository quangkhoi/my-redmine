export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getNextFriday(date: Date): Date {
  const monday = getMondayOfWeek(date);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday;
}

export function getPreviousMonday(date: Date): Date {
  const monday = getMondayOfWeek(date);
  monday.setDate(monday.getDate() - 7);
  return monday;
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

export function isDueTodayOrPast(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) <= today;
}

export function isStartDateTodayOrPast(startDate: string | null): boolean {
  if (!startDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(startDate) <= today;
}

export function isStartDateBeyondThreshold(startDate: string | null): boolean {
  if (!startDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const dayOfWeek = today.getDay();
  const threshold = dayOfWeek === 5 ? 3 : 1; // Friday: 3 days ahead, else 1
  const expected = new Date(today);
  expected.setDate(today.getDate() + threshold);
  expected.setHours(0, 0, 0, 0);
  return start.getTime() === expected.getTime();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
