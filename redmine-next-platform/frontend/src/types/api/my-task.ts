export type MyTaskApiResponse = {
  userName: string;
  displayName: string;
  items: Array<{
    issueKey: string;
    subject: string;
    status: string;
  }>;
};

export type MyTaskViewModel = MyTaskApiResponse;
