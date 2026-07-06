export type DailyReportApiResponse = {
  reportDate: string;
  userName: string;
  groups: Array<{
    key: string;
    label: string;
    assigneeId: number | null;
    items: Array<{
      issueId: number;
      issueKey: string;
      subject: string;
      status: string;
      trackerName: string;
      startDate: string | null;
      dueDate: string | null;
    }>;
  }>;
  other: {
    key: string;
    label: string;
    assigneeId: number | null;
    items: Array<{
      issueId: number;
      issueKey: string;
      subject: string;
      status: string;
      trackerName: string;
      startDate: string | null;
      dueDate: string | null;
    }>;
  };
};

export type DailyReportViewModel = {
  reportDate: string;
  userName: string;
  groups: Array<{
    key: string;
    label: string;
    assigneeId: number | null;
    items: Array<{
      issueId: number;
      issueKey: string;
      subject: string;
      status: string;
      trackerName: string;
      startDate: string | null;
      dueDate: string | null;
    }>;
  }>;
  totalItems: number;
};

export function toDailyReportViewModel(payload: DailyReportApiResponse): DailyReportViewModel {
  const groups = [...payload.groups, payload.other];

  return {
    reportDate: payload.reportDate,
    userName: payload.userName,
    groups,
    totalItems: groups.reduce((count, group) => count + group.items.length, 0)
  };
}
