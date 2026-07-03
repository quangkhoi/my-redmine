export type LogTimeApiResponse = {
  userName: string;
  displayName: string;
  reportDate: string;
  items: Array<{
    issueKey: string;
    subject: string;
    status: string;
    hoursLogged: number;
  }>;
};

export type LogTimeViewModel = LogTimeApiResponse;
