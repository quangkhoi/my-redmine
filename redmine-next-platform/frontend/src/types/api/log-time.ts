export type LogTimeApiResponse = {
  userName: string;
  displayName: string;
  reportDate: string;
  items: Array<{
    issueId: number;
    issueKey: string;
    subject: string;
    status: string;
    hoursLogged: number;
    assigneeName: string | null;
    startDate: string | null;
    dueDate: string | null;
  }>;
};

export type LogTimeViewModel = LogTimeApiResponse;
