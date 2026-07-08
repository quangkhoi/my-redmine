export type MyTaskApiResponse = {
  userName: string;
  displayName: string;
  items: Array<{
    issueKey: string;
    subject: string;
    status: string;
    projectName: string | null;
    startDate: string | null;
    dueDate: string | null;
    doneRatio: number;
    trackerName: string | null;
  }>;
};

export type MyTaskViewModel = MyTaskApiResponse;
