// Run: node scripts/test-member-stats.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const constants = source.slice(source.indexOf("const ASSIGNEES ="), source.indexOf("const WORK_ITEM_STATUS_NAMES"));
const names = ["fetchTimeEntryPages", "summarizeMemberTime", "renderMemberStats", "renderMemberStatsControls",
  "renderMemberStatsConditions", "getSelectedMemberStatsRange", "validateDateRange", "parseInputDate",
  "formatApiDate", "formatInputDate", "pad2", "formatHours", "escapeHtml"];
const code = names.map((name) => {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert(start >= 0, `Missing ${name}`);
  return source.slice(start, source.indexOf("\n}", start) + 2);
}).join("\n");

const entries = [
  { id: 1, user: { id: 94 }, issue: { id: 42 }, spent_on: "2026-09-01", hours: 0.1, activity: { name: "開発：1回目" } },
  { id: 2, user: { id: 94 }, issue: { id: 99 }, spent_on: "2026-09-30", hours: 0.2, activity: { name: "開発：1回目" } },
  { id: 3, user: { id: 99 }, spent_on: "2026-09-03", hours: 2, activity: { name: "開発単体テスト" } },
  { id: 4, user: { id: 99 }, spent_on: "2026-09-04", hours: 3, activity: { name: "開発修正：2回目以降" } },
  { id: 5, user: { id: 106 }, spent_on: "2026-09-05", hours: 4, activity: { name: "コードレビュー" } },
  { id: 6, user: { id: 106 }, spent_on: "2026-09-06", hours: 1.5, activity: { name: "Unmapped" } },
  { id: 7, user: { id: 113 }, spent_on: "2026-09-07", hours: 1, activity: {} },
  { id: 8, user: { id: 999 }, spent_on: "2026-09-08", hours: 100, activity: { name: "開発：1回目" } },
  { id: 9, user: { id: 94 }, spent_on: "2026-08-31", hours: 40, activity: { name: "開発：1回目" } },
  { id: 10, user: { id: 94 }, spent_on: "2026-10-01", hours: 40, activity: { name: "開発：1回目" } },
  ...Array.from({ length: 101 }, (_, i) => ({
    id: 100 + i, user: { id: 123 }, spent_on: "2026-09-10", hours: 0.5,
    activity: { name: "開発単体テスト" },
  })),
];
const requests = [];
const els = {
  memberStatsFromDate: { value: "" },
  memberStatsToDate: { value: "" },
  memberStatsTitle: { textContent: "" },
  memberStatsInfo: { textContent: "" },
  memberStatsChart: { innerHTML: "" },
  memberStatsRows: { innerHTML: "" },
};
const context = {
  URL,
  Date: class extends Date {
    constructor(...args) { super(...(args.length ? args : [2026, 9, 14])); }
  },
  els,
  normalizeBaseUrl: (value) => value,
  getApiBaseUrl: () => "https://test.invalid",
  redmineGet: async (url) => {
    const params = url.searchParams;
    requests.push(Object.fromEntries(params));
    const matching = entries.filter((entry) => entry.spent_on >= params.get("from") && entry.spent_on <= params.get("to"));
    const offset = Number(params.get("offset"));
    return { time_entries: matching.slice(offset, offset + 100), total_count: matching.length };
  },
};
vm.createContext(context);
vm.runInContext(`${constants}\n${code}`, context);

(async () => {
  context.renderMemberStatsControls();
  assert.equal(els.memberStatsFromDate.value, "2026-10-01");
  assert.equal(els.memberStatsToDate.value, "2026-10-31");
  assert(els.memberStatsTitle.textContent.includes("2026-10-01 ~ 2026-10-31"));

  els.memberStatsFromDate.value = "2026-09-01";
  els.memberStatsToDate.value = "2026-09-30";
  const range = context.getSelectedMemberStatsRange();
  context.validateDateRange(range.from, range.to);
  const monthEntries = await context.fetchTimeEntryPages({
    spentFrom: range.from, spentTo: range.to,
  });
  assert.equal(monthEntries.length, 109);
  assert.deepEqual(requests.map((request) => request.offset), ["0", "100"]);
  assert(requests.every((request) => request.from === "2026-09-01" && request.to === "2026-09-30"));
  assert(requests.every((request) => !request.user_id && !request.issue_id));

  els.memberStatsFromDate.value = "2026-09-02";
  els.memberStatsToDate.value = "2026-09-09";
  const customRange = context.getSelectedMemberStatsRange();
  context.validateDateRange(customRange.from, customRange.to);
  const customEntries = await context.fetchTimeEntryPages({ spentFrom: customRange.from, spentTo: customRange.to });
  assert.equal(customEntries.length, 6);
  assert.equal(requests.at(-1).from, "2026-09-02");
  assert.equal(requests.at(-1).to, "2026-09-09");
  els.memberStatsToDate.value = "2026-09-01";
  const invalidRange = context.getSelectedMemberStatsRange();
  assert.throws(() => context.validateDateRange(invalidRange.from, invalidRange.to));
  els.memberStatsToDate.value = "";
  const missingDateRange = context.getSelectedMemberStatsRange();
  assert.throws(() => context.validateDateRange(missingDateRange.from, missingDateRange.to));

  const stats = context.summarizeMemberTime(monthEntries);
  assert.equal(stats.length, 6);
  assert.equal(stats[0].code.toFixed(2), "0.30");
  assert.equal(stats[0].total.toFixed(2), "0.30");
  assert.equal(stats[1].test, 2);
  assert.equal(stats[1].fix, 3);
  assert.equal(stats[2].review, 4);
  assert.equal(stats[2].other, 1.5);
  assert.equal(stats[3].other, 1);
  assert.equal(stats[4].total, 0);
  assert.equal(stats[5].test, 50.5);
  assert.equal(stats.reduce((sum, item) => sum + item.total, 0).toFixed(2), "62.30");

  context.renderMemberStats(stats);
  assert.equal((els.memberStatsChart.innerHTML.match(/member-stats-chart-row/g) || []).length, 6);
  assert.equal((els.memberStatsRows.innerHTML.match(/<tr>/g) || []).length, 6);
  assert(els.memberStatsChart.innerHTML.includes("50.5 h"));
  assert(els.memberStatsRows.innerHTML.includes("50.5 h"));
  assert([...els.memberStatsChart.innerHTML.matchAll(/width:([\d.]+)%/g)].every((match) => Number(match[1]) <= 100));

  context.renderMemberStats(context.summarizeMemberTime([]));
  assert(!els.memberStatsChart.innerHTML.includes("NaN") && !els.memberStatsChart.innerHTML.includes("Infinity"));
  assert.equal((els.memberStatsRows.innerHTML.match(/0 h/g) || []).length, 36);
  console.log("PASS: member activity totals, date range and defaults, pagination, chart and table, zero hours.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
