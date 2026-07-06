export type DashboardIssueApiResponse = {
  id: number;
  subject: string;
  projectName: string | null;
  trackerName: string | null;
  statusName: string | null;
  assigneeName: string | null;
  startDate: string | null;
  dueDate: string | null;
  doneRatio: number;
  spentHours: number | null;
  releaseTarget: string | null;
};

export type DashboardIssueListApiResponse = {
  name: string;
  issues: DashboardIssueApiResponse[];
};

export type DashboardIssuesApiResponse = {
  processing: DashboardIssueListApiResponse;
  notStarted: DashboardIssueListApiResponse;
  processed: DashboardIssueListApiResponse;
};

export type DashboardIssueViewModel = DashboardIssueApiResponse;

export type DashboardIssueListViewModel = {
  name: string;
  issues: DashboardIssueViewModel[];
};

export type DashboardIssuesViewModel = {
  processing: DashboardIssueListViewModel;
  notStarted: DashboardIssueListViewModel;
  processed: DashboardIssueListViewModel;
};
