const REDMINE_BASE_URL = "https://redmine.wdm.co.jp";

export function getIssueUrl(issueId: number): string {
  return `${REDMINE_BASE_URL}/issues/${issueId}`;
}

export function getIssueUrlFromKey(issueKey: string): string {
  const id = parseInt(issueKey.replace("#", ""), 10);
  if (isNaN(id)) return "#";
  return getIssueUrl(id);
}
