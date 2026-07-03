export type DailyReportApiResponse = {
  reportDate: string;
  userName: string;
  items: Array<{
    issueKey: string;
    subject: string;
    status: string;
    hoursSpent: number;
  }>;
};

export type DailyReportViewModel = DailyReportApiResponse;
