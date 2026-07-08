export const ASSIGNEES = [
  { id: 94, name: "Nam", login: "namtran" },
  { id: 99, name: "Tuyen", login: "tuyennguyen" },
  { id: 106, name: "Duy", login: "duydinh" },
  { id: 113, name: "Anh", login: "260618" },
  { id: 114, name: "Khoi", login: "khoiduong" },
  { id: 123, name: "Phi", login: "phihoang1994" },
] as const;

export type Assignee = (typeof ASSIGNEES)[number];

export const DASHBOARD_ASSIGNEE_IDS = [94, 99, 106, 113, 114, 123] as const;
export const DAILY_REPORT_ASSIGNEE_IDS = [94, 99, 106, 123] as const;
export const DAILY_REPORT_OTHER_ID = 114;
export const DAILY_REPORT_OTHER_NAME = "Khoi";
