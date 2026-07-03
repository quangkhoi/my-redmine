export type DashboardApiResponse = {
  userName: string;
  reportDate: string;
  metrics: Array<{
    code: string;
    label: string;
    value: number;
  }>;
};

export type DashboardViewModel = DashboardApiResponse;
