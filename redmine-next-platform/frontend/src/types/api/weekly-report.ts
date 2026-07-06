export type WeeklyReportApiResponse = {
  userName: string;
  hasPrevious: boolean;
  range: {
    from: string;
    to: string;
  };
  exportRange: {
    from: string;
    to: string;
  };
  prevCsharp: Array<{
    issueId: number;
    issueKey: string;
    projectName: string;
    subject: string;
    status: string;
    trackerName: string;
    startDate: string | null;
    dueDate: string | null;
    reportSpentHours: number;
  }>;
  prevWeb: Array<{
    issueId: number;
    issueKey: string;
    projectName: string;
    subject: string;
    status: string;
    trackerName: string;
    startDate: string | null;
    dueDate: string | null;
    reportSpentHours: number;
  }>;
  currentCsharp: Array<{
    issueId: number;
    issueKey: string;
    projectName: string;
    subject: string;
    status: string;
    trackerName: string;
    startDate: string | null;
    dueDate: string | null;
    reportSpentHours: number;
  }>;
  currentWeb: Array<{
    issueId: number;
    issueKey: string;
    projectName: string;
    subject: string;
    status: string;
    trackerName: string;
    startDate: string | null;
    dueDate: string | null;
    reportSpentHours: number;
  }>;
};

export type WeeklyReportViewItem = {
  issueId: number;
  issueKey: string;
  projectName: string;
  subject: string;
  status: string;
  trackerName: string;
  startDate: string | null;
  dueDate: string | null;
  reportSpentHours: number;
};

export type WeeklyReportSection = {
  key: "prevCsharp" | "prevWeb" | "currentCsharp" | "currentWeb";
  title: string;
  items: Array<WeeklyReportViewItem>;
};

export type WeeklyReportViewModel = {
  userName: string;
  hasPrevious: boolean;
  range: {
    from: string;
    to: string;
  };
  exportRange: {
    from: string;
    to: string;
  };
  sections: Array<WeeklyReportSection>;
  totalItems: number;
};

export function toWeeklyReportViewModel(payload: WeeklyReportApiResponse): WeeklyReportViewModel {
  const sections = [
    { key: "prevCsharp", title: "Previous C#", items: payload.prevCsharp },
    { key: "prevWeb", title: "Previous Web", items: payload.prevWeb },
    { key: "currentCsharp", title: "Current C#", items: payload.currentCsharp },
    { key: "currentWeb", title: "Current Web", items: payload.currentWeb }
  ] as const satisfies Array<WeeklyReportSection>;

  return {
    userName: payload.userName,
    hasPrevious: payload.hasPrevious,
    range: payload.range,
    exportRange: payload.exportRange,
    sections: sections.filter((section) => payload.hasPrevious || !section.key.startsWith("prev")),
    totalItems: sections
      .filter((section) => payload.hasPrevious || !section.key.startsWith("prev"))
      .reduce((count, section) => count + section.items.length, 0)
  };
}
