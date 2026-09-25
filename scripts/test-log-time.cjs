// Run: node scripts/test-log-time.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const names = ["fetchLoginTimeIssues", "fetchSpentDetailsForIssues", "fetchSpentHoursForIssues",
  "fetchTimeEntryPages", "sortTimeEntries", "compareDate", "getSpentUserIds",
  "formatApiDate", "pad2", "applyLogTimeLoggedUserFilter", "loginTimeRow",
  "timeEntryDetails", "timeEntryDetail", "formatHours", "formatDate", "escapeHtml", "escapeAttr"];
const code = names.map((name) => {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert(start >= 0, `Missing ${name}`);
  return source.slice(start, source.indexOf("\n}", start) + 2);
}).join("\n");
const entry = (id, issue, user, spent_on, hours) => ({ id, issue: { id: issue }, user: { id: user }, spent_on, hours });
const entries = [entry(1, 1, 94, "2026-08-31", 10), entry(2, 1, 99, "2026-09-01", 2),
  entry(3, 1, 94, "2026-09-30", 3), entry(4, 1, 94, "2026-10-01", 20),
  entry(5, 2, 94, "2026-08-31", 7), entry(6, 99, 94, "2026-09-10", 50),
  ...Array.from({ length: 101 }, (_, i) => entry(100 + i, 4, 94, "2026-07-01", 1))];
const requests = [];
const context = {
  URL, normalizeBaseUrl: (s) => s, getApiBaseUrl: () => "https://test.invalid",
  getSelectedLoginMonthRange: () => ({ monthStart: new Date(2026, 8, 1), monthEnd: new Date(2026, 8, 30) }),
  getSelectedLoginAssigneeIds: () => [94],
  fetchIssuesForAssigneeIds: async () => [1, 2, 3, 4].map((id) => ({ id })),
  isLoginTimeIssue: () => true, sortIssues: (rows) => rows,
  getIssueUrl: (issue) => `https://test.invalid/issues/${issue.id}`,
  highlightSearchText: (s) => String(s), isOverdue: () => false,
  redmineGet: async (url) => {
    const p = url.searchParams;
    requests.push(Object.fromEntries(p));
    const rows = entries.filter((e) => (!p.has("issue_id") || e.issue.id === Number(p.get("issue_id"))) &&
      (!p.has("user_id") || e.user.id === Number(p.get("user_id"))) &&
      (!p.has("from") || e.spent_on >= p.get("from")) && (!p.has("to") || e.spent_on <= p.get("to")));
    return { time_entries: rows.slice(Number(p.get("offset")), Number(p.get("offset")) + 100), total_count: rows.length };
  },
};
vm.createContext(context);
vm.runInContext(code, context);
(async () => {
  const issues = await context.fetchLoginTimeIssues();
  assert.deepEqual(Array.from(issues, (i) => i.loginSpentHours), [5, 0, 0, 0]);
  assert.deepEqual(Array.from(issues, (i) => i.loginSpentEntries.length), [4, 1, 0, 101]);
  assert.deepEqual(Array.from(issues[0].spentUserIds).sort(), [94, 99]);
  assert.equal(issues[1].spentUserIds.length, 0);
  assert(requests.filter((r) => r.issue_id).every((r) => !r.from && !r.to));
  assert(requests.some((r) => r.issue_id === "4" && r.offset === "100"));
  const html = context.loginTimeRow(issues[0], 0);
  for (const date of ["31/08/2026", "01/09/2026", "30/09/2026", "01/10/2026"]) assert(html.includes(date));
  assert(html.includes("5 h"));
  const rows = Array.from(issues, (i) => ({ dataset: { spentUserIds: i.spentUserIds.join(",") } }));
  context.els = { loginLoggedUserId: { value: "94" }, loginTimeRows: { querySelectorAll: () => rows }, toggleLoggedTimeTickets: {} };
  context.hideLoggedTimeTickets = true;
  context.applyLogTimeLoggedUserFilter();
  assert.deepEqual(rows.map((r) => r.hidden), [true, false, false, false]);
  context.hideLoggedTimeTickets = false;
  context.applyLogTimeLoggedUserFilter();
  assert(rows.every((r) => !r.hidden));
  const hours = await context.fetchSpentHoursForIssues([{ id: 1 }], { from: new Date(2026, 8, 1), to: new Date(2026, 8, 30), userId: 94 });
  assert.equal(hours.get(1), 3, "Other reports retain date/user filtering");
  console.log("PASS: all-date entries and UI dates, monthly totals and hide filter, pagination, empty entries, other reports.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
