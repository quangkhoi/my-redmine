export type WeeklyReportApiResponse = {
  weekStart: string;
  weekEnd: string;
  userName: string;
  items: Array<{
    issueKey: string;
    subject: string;
    status: string;
    day: string;
    hoursSpent: number;
  }>;
};

export type WeeklyReportViewModel = WeeklyReportApiResponse;
