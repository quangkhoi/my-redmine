// Run: node scripts/test-timesheet-export.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");

function extractFunction(name) {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert(start >= 0, `Missing function ${name}`);
  return source.slice(start, source.indexOf("\n}", start) + 2);
}

const functionNames = ["buildTimesheetSheet", "exportLogTimeReport", "reportColumnWidth",
  "convertCharsToExcelColumnWidth", "normalizeBaseUrl", "sortTimeEntries", "compareDate", "pad2", "formatTimestamp"];
const consts = ["TIMESHEET_STYLE", "DAY_NAMES", "WORKING_HOURS_PER_DAY"];
let code = functionNames.map(extractFunction).join("\n");
consts.forEach((name) => {
  const start = source.indexOf(`const ${name} =`);
  assert(start >= 0, `Missing const ${name}`);
  const end = source.indexOf(";", source.indexOf(name === "TIMESHEET_STYLE" ? "};" : name, start));
  code += "\n" + source.slice(start, end + 1);
});
const configSource = fs.readFileSync(path.join(root, "members-config.js"), "utf8");
const vendorSource = fs.readFileSync(path.join(root, "vendor/xlsx.full.min.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert(vendorSource.includes('count="11"'), "styles.xml cellXfs should define 11 styles");
assert(vendorSource.includes('name val="Meiryo UI"'), "all fonts should use Meiryo UI");
assert.equal((vendorSource.match(/sz val="10"/g) || []).length, 5, "all fonts should use size 10");
assert(vendorSource.includes("FFD9D9D9"), "styles.xml should contain grey weekend fill");
assert(vendorSource.includes('patternType="solid"'), "styles.xml should contain a solid fill");
assert(!vendorSource.includes("FFB7C9C4"), "table borders should be black, not pastel");
assert.equal((vendorSource.match(/FF000000/g) || []).length, 4, "thin border on all four sides is black");
assert(indexHtml.includes('id="exportLogTime"'), "Log time view should expose export button");
assert(indexHtml.includes("members-config.js"), "index.html should load members-config.js");

const context = {
  console, URL, TextEncoder, Blob,
  REDMINE: { baseUrl: "https://redmine.wdm.co.jp/" },
  getSelectedLoginMonthRange: () => ({
    year: 2026, month: 8,
    monthStart: new Date(2026, 7, 1), monthEnd: new Date(2026, 7, 31),
  }),
  requireRuntimeConfig: () => {},
  beginGlobalLoading: () => {}, endGlobalLoading: () => {},
  setStatus: (message, type) => { context.lastStatus = { message, type }; },
  els: { exportLogTime: { disabled: false } },
};
context.window = context;
vm.createContext(context);
vm.runInContext(vendorSource, context);
vm.runInContext(configSource, context);
vm.runInContext(code, context);

const members = vm.runInContext("MEMBERS_CONFIG", context);
assert.equal(members.length, 5, "members config loads 5 active members");

const entry = (spent_on, hours, issueId, comments) =>
  ({ spent_on, hours, comments, user: { id: 99 }, issue: issueId ? { id: issueId } : null });
const tuyenEntries = [
  entry("2026-08-03", 8, 94952, "Fix comment & testing"),
  entry("2026-08-04", 3, 97109, "Study task demand"),
  entry("2026-08-04", 5, 97528, ""),
  entry("2026-08-05", 1, 89746, ""),
  entry("2026-08-07", 4, null, "Meeting"),
  entry("2026-08-12", 10, 97826, "Overtime"),
];
const namEntries = [entry("2026-08-06", 6, 97109, "Nam work")];
namEntries.forEach((e) => { e.user = { id: 94 }; });

const range = context.getSelectedLoginMonthRange();
const sheet = context.buildTimesheetSheet(context.sortTimeEntries(tuyenEntries), members[1], range);
const cell = (r, c) => sheet[context.window.XLSX.utils.encode_cell({ r, c })];
const dataRows = [];
for (let r = 10; r < 60; r += 1) {
  const date = cell(r, 1);
  if (!date) break;
  dataRows.push({ r, date: date.v, day: cell(r, 2) ? cell(r, 2).v : "", type: cell(r, 3) ? cell(r, 3).v : "",
    desc: cell(r, 4), hours: cell(r, 5), notes: cell(r, 6) ? cell(r, 6).v : "" });
}
const rowsFor = (date) => dataRows.filter((row) => row.date === date);

assert.equal(cell(1, 1).v, "Working Timesheet Report");
assert.equal(cell(1, 1).s, 1, "title style");
assert.equal(cell(3, 1).s, 9, "info labels bold with border");
assert.equal(cell(3, 2).s, 5, "info values with border");
assert.equal(cell(3, 4).s, 5, "info grid blank cells bordered");
assert.equal(cell(5, 8).s, 5, "info grid extends rows 3-5 cols 1-8");
assert.equal(cell(3, 2).v, "WDM");
assert.equal(cell(3, 6).v, "248", "employee id from config");
assert.equal(cell(4, 2).v, "Nguyen Dinh Tuyen");
assert.equal(cell(4, 6).v, "Senior Dev");
assert.equal(cell(5, 2).v, "2026/08");
assert.equal(cell(4, 7).s, 9, "total label bordered");
assert.equal(sheet["!merges"].length, 4, "four header merges");

const weekend = rowsFor("08/01").concat(rowsFor("08/02"), rowsFor("08/08"), rowsFor("08/09"));
assert.equal(weekend.length, 4, "weekend days each render one row");
weekend.forEach((row) => assert.equal(cell(row.r, 1).s, 8, "weekend cells use grey style"));
assert.equal(cell(rowsFor("08/01")[0].r, 2).v, "Sat");
assert.equal(cell(rowsFor("08/02")[0].r, 2).v, "Sun");

const aug3 = rowsFor("08/03");
assert.equal(aug3.length, 1);
assert.equal(aug3[0].type, "On-Ticket");
assert.equal(aug3[0].desc.v, "https://redmine.wdm.co.jp/issues/94952");
assert.equal(aug3[0].desc.l.Target, "https://redmine.wdm.co.jp/issues/94952");
assert.equal(aug3[0].desc.s, 10, "hyperlink style left-aligned");
assert.equal(aug3[0].hours.v, 8);
assert.equal(aug3[0].hours.s, 6, "log work centered");
assert.equal(aug3[0].notes, "Fix comment & testing");

const aug4 = rowsFor("08/04");
assert.equal(aug4.length, 2, "two entries on 08/04, no remain row");
assert.deepEqual(aug4.map((row) => row.hours.v), [3, 5]);

const aug5 = rowsFor("08/05");
assert.equal(aug5.length, 2, "entry + remain row on 08/05");
assert.equal(aug5[0].hours.v, 1);
assert.equal(aug5[1].type, "Non-Ticket");
assert.equal(aug5[1].desc.v, "-");
assert.equal(aug5[1].desc.s, 5, "description left-aligned");
assert.equal(aug5[1].hours.v, 7, "remain = 8 - 1");

const aug7 = rowsFor("08/07");
assert.equal(aug7.length, 2, "non-ticket entry + remain row on 08/07");
assert.equal(aug7[0].type, "Non-Ticket");
assert.equal(aug7[0].desc.v, "-");
assert.equal(aug7[0].hours.v, 4);
assert.equal(aug7[0].notes, "Meeting");
assert.equal(aug7[1].hours.v, 4);

const aug6 = rowsFor("08/06");
assert.equal(aug6.length, 1, "empty weekday renders one row");
assert.equal(aug6[0].type, "Non-Ticket");
assert.equal(aug6[0].hours.v, 8);

const aug12 = rowsFor("08/12");
assert.equal(aug12.length, 1, "day logged over 8h gets no remain row");
assert.equal(aug12[0].hours.v, 10);

const totalCell = cell(4, 8);
assert.equal(totalCell.v, 170, "total = 21 weekdays baseline with 10h overtime day");

for (let day = 1; day <= 31; day += 1) {
  const date = `08/${String(day).padStart(2, "0")}`;
  assert(rowsFor(date).length > 0, `${date} present in report`);
}
const weekdayCount = Array.from({ length: 31 }, (_, i) => new Date(2026, 7, i + 1).getDay())
  .filter((d) => d !== 0 && d !== 6).length;
assert.equal(weekdayCount, 21, "August 2026 has 21 weekdays");

const written = [];
context.XLSX.writeFile = (workbook, name) => { written.push({ workbook, name }); };
const allEntries = tuyenEntries.concat(namEntries);
context.fetchTimeEntryPages = async ({ userId }) =>
  allEntries.filter((e) => e.user.id === userId && e.spent_on >= "2026-08-01" && e.spent_on <= "2026-08-31");

(async () => {
  await context.exportLogTimeReport();
  assert.equal(written.length, 1, "one workbook written");
  assert.match(written[0].name, /^WorkingSummary_8月_\d{8}_\d{4}\.xlsx$/, "filename format");
  assert.deepEqual(Array.from(written[0].workbook.SheetNames),
    ["報告書_8月_DuongQuangKhoi", "報告書_8月_TranHuyNam", "報告書_8月_NguyenDinhTuyen",
      "報告書_8月_DinhThanhDuy", "報告書_8月_LaHoangPhi"], "sheets ordered by order field");
  assert.equal(context.els.exportLogTime.disabled, false, "button re-enabled");
  assert.equal(context.lastStatus.type, "ok");
  assert.match(context.lastStatus.message, /Exported 5 member sheets for 2026\/08/);

  const tuyenSheet = written[0].workbook.Sheets["報告書_8月_NguyenDinhTuyen"];
  const namSheet = written[0].workbook.Sheets["報告書_8月_TranHuyNam"];
  assert(tuyenSheet && namSheet, "sheets exist");
  const sheetTotal = (s) => s[context.window.XLSX.utils.encode_cell({ r: 4, c: 8 })].v;
  assert.equal(sheetTotal(tuyenSheet), 170);
  assert.equal(sheetTotal(namSheet), 168, "member with only 08/06 log: 21*8 baseline");

  const namAug6 = [];
  for (let r = 10; r < 60; r += 1) {
    const date = namSheet[context.window.XLSX.utils.encode_cell({ r, c: 1 })];
    if (!date) break;
    if (date.v === "08/06") namAug6.push(namSheet[context.window.XLSX.utils.encode_cell({ r, c: 5 })]);
  }
  assert.equal(namAug6.length, 2, "Nam 08/06: 6h entry + 2h remain");
  assert.deepEqual(namAug6.map((c) => c.v), [6, 2]);
  console.log("PASS: timesheet sheet layout, weekend grey, remain rows, totals, multi-sheet export, filename.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
