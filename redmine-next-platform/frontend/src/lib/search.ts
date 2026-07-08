export function normalizeSearchTerm(value: string): string {
  return value.toLowerCase().trim();
}

export function buildIssueSearchText(issue: {
  id?: number;
  issueId?: number;
  subject: string;
  projectName?: string | null;
  assigneeName?: string | null;
}): string {
  const id = String(issue.id ?? issue.issueId ?? "");
  const project = issue.projectName ?? "";
  const assignee = issue.assigneeName ?? "";
  return `${id} ${issue.subject} ${project} ${assignee}`.toLowerCase();
}

export function issueMatchesSearch(issue: {
  id?: number;
  issueId?: number;
  subject: string;
  projectName?: string | null;
  assigneeName?: string | null;
}, term: string): boolean {
  if (!term) return true;
  const normalized = normalizeSearchTerm(term);
  return buildIssueSearchText(issue).includes(normalized);
}

export function filterBySearch<T extends { id?: number; issueId?: number; subject: string; projectName?: string | null; assigneeName?: string | null }>(
  items: T[],
  term: string
): T[] {
  if (!term) return items;
  return items.filter(item => issueMatchesSearch(item, term));
}
