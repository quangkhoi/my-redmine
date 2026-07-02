const REDMINE = {
  baseUrl: "https://redmine.wdm.co.jp/",
  proxyUrl: "https://redmine-https-proxy.qkhoiwork.workers.dev",
};

const ISSUE_STATUS = {
  notStarted: { id: 1, name: "未対応" },
  processing: { id: 2, name: "処理中" },
  processed : { id: 3, name: "処理済み" },
  done      : { id: 5, name: "完了" },
  cancelled : { id: 6, name: "完了（中止）" },
  onHold    : { id: 7, name: "完了（保留）" },
};

const STATUS_IDS = {
  processing: ISSUE_STATUS.processing.id,
  notStarted: ISSUE_STATUS.notStarted.id,
  processed : ISSUE_STATUS.processed.id,
  done      : ISSUE_STATUS.done.id,
  cancelled : ISSUE_STATUS.cancelled.id,
  onHold    : ISSUE_STATUS.onHold.id,
};
const ASSIGNEES = [
  { id: 94, name: "Nam" },
  { id: 99, name: "Tuyen" },
  { id: 106, name: "Duy" },
  { id: 113, name: "Anh" },
  { id: 114, name: "Khoi" },
  { id: 123, name: "Phi" },
];
const DASHBOARD_ASSIGNEE_IDS = ASSIGNEES.map((user) => user.id);

const WORK_ITEM_STATUS_NAMES = new Set([
  ISSUE_STATUS.notStarted.name,
  ISSUE_STATUS.processing.name,
  ISSUE_STATUS.processed.name,
  ISSUE_STATUS.done.name,
]);

const MY_TASK_EXCLUDED_STATUS_NAMES = new Set([
  ISSUE_STATUS.cancelled.name,
  ISSUE_STATUS.onHold.name,
  ISSUE_STATUS.done.name,
]);
const RELEASE_TARGET_FIELD_NAME = "リリース対象";
const RELEASE_TARGET_VALUE_NAMES = new Map([
  ["36", "ESP"],
  ["40", "WEB"],
  ["41", ".env"],
  ["37", "バッチ"],
  ["39", "DB"],
]);
const TRACKER_NAMES = {
  development: "開発",
  research: "調査",
};
const DAILY_REPORT_ASSIGNEES = ASSIGNEES.filter((user) => user.id !== 113 && user.id !== 114);
const DAILY_REPORT_OTHER = {
  key: "other",
  assigneeId: 114,
  tracker: TRACKER_NAMES.development,
};
const CIRCLED_NUMBERS = [
  "①",
  "②",
  "③",
  "④",
  "⑤",
  "⑥",
  "⑦",
  "⑧",
  "⑨",
  "⑩",
  "⑪",
  "⑫",
  "⑬",
  "⑭",
  "⑮",
];

const els = {
  appLayout: document.querySelector(".app-layout"),
  collapseSidebar: document.querySelector("#collapseSidebar"),
  expandSidebar: document.querySelector("#expandSidebar"),
  globalIssueSearch: document.querySelector("#globalIssueSearch"),
  loadDashboard: document.querySelector("#loadDashboard"),
  loadDailyReport: document.querySelector("#loadDailyReport"),
  copyDailyReport: document.querySelector("#copyDailyReport"),
  loadMyTask: document.querySelector("#loadMyTask"),
  loadReport: document.querySelector("#loadReport"),
  exportReport: document.querySelector("#exportReport"),
  loadLoginTime: document.querySelector("#loadLoginTime"),
  dashboardStartDateFrom: document.querySelector("#dashboardStartDateFrom"),
  dashboardStartDateTo: document.querySelector("#dashboardStartDateTo"),
  myTaskUserId: document.querySelector("#myTaskUserId"),
  myTaskStartDate: document.querySelector("#myTaskStartDate"),
  myTaskEndDate: document.querySelector("#myTaskEndDate"),
  myTaskStartCondition: document.querySelector("#myTaskStartCondition"),
  myTaskEndCondition: document.querySelector("#myTaskEndCondition"),
  myTaskInfo: document.querySelector("#myTaskInfo"),
  myTaskRows: document.querySelector("#myTaskRows"),
  reportFromDate: document.querySelector("#reportFromDate"),
  reportToDate: document.querySelector("#reportToDate"),
  reportRangeLabel: document.querySelector("#reportRangeLabel"),
  reportInfo: document.querySelector("#reportInfo"),
  reportRows: document.querySelector("#reportRows"),
  loginUserId: document.querySelector("#loginUserId"),
  loginYear: document.querySelector("#loginYear"),
  loginMonth: document.querySelector("#loginMonth"),
  loginTimeTitle: document.querySelector("#loginTimeTitle"),
  loginTimeInfo: document.querySelector("#loginTimeInfo"),
  loginLoggedUserId: document.querySelector("#loginLoggedUserId"),
  toggleLoggedTimeTickets: document.querySelector("#toggleLoggedTimeTickets"),
  loginTimeRows: document.querySelector("#loginTimeRows"),
  notStartedStartCondition: document.querySelector("#notStartedStartCondition"),
  notStartedDueCondition: document.querySelector("#notStartedDueCondition"),
  processingCount: document.querySelector("#processingCount"),
  notStartedCount: document.querySelector("#notStartedCount"),
  processedCount: document.querySelector("#processedCount"),
  processingInfo: document.querySelector("#processingInfo"),
  notStartedInfo: document.querySelector("#notStartedInfo"),
  processedInfo: document.querySelector("#processedInfo"),
  processingRows: document.querySelector("#processingRows"),
  notStartedRows: document.querySelector("#notStartedRows"),
  processedRows: document.querySelector("#processedRows"),
  reloadProcessing: document.querySelector("#reloadProcessing"),
  reloadNotStarted: document.querySelector("#reloadNotStarted"),
  reloadProcessed: document.querySelector("#reloadProcessed"),
  hideNotStartedNonDevelopment: document.querySelector("#hideNotStartedNonDevelopment"),
  hideProcessedResearch: document.querySelector("#hideProcessedResearch"),
  dailyReportInfo: document.querySelector("#dailyReportInfo"),
  dailyReportContent: document.querySelector("#dailyReportContent"),
  navGroups: document.querySelectorAll(".nav-group"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
};

const dashboardAssigneeIdSet = new Set(DASHBOARD_ASSIGNEE_IDS);
let hideLoggedTimeTickets = false;
let globalIssueSearchTerm = "";
let globalLoadingCount = 0;
let dashboardLists = { processing: [], notStarted: [], processed: [] };
let hideNotStartedNonDevelopment = false;
let hideProcessedResearch = false;
let loadedReportLists = null;
let loadedDailyReportIssues = [];
let loadedMyTaskIssues = [];
let loadedLoginTimeIssues = [];
let releaseTargetValueNames = new Map();

function init() {
  renderDashboardControls();
  renderMyTaskControls();
  renderReportControls();
  renderLoginTimeControls();
  renderListConditions();
  renderMyTaskConditions();
  renderReportConditions();
  renderLoginTimeConditions();
  renderInitialEmptyLists();
  syncGlobalIssueSearchValue();
  bindEvents();
}

function syncGlobalIssueSearchValue() {
  if (els.globalIssueSearch) {
    els.globalIssueSearch.value = globalIssueSearchTerm;
  }
}

function bindEvents() {
  els.collapseSidebar.addEventListener("click", collapseSidebar);
  els.expandSidebar.addEventListener("click", expandSidebar);
  els.globalIssueSearch.addEventListener("input", handleGlobalIssueSearchInput);
  els.loadDashboard.addEventListener("click", loadDashboard);
  els.reloadProcessing.addEventListener("click", () => reloadDashboardList("processing"));
  els.reloadNotStarted.addEventListener("click", () => reloadDashboardList("notStarted"));
  els.reloadProcessed.addEventListener("click", () => reloadDashboardList("processed"));
  els.loadDailyReport.addEventListener("click", loadDailyReport);
  els.copyDailyReport.addEventListener("click", copyDailyReport);
  els.loadMyTask.addEventListener("click", loadMyTask);
  els.loadReport.addEventListener("click", loadReport);
  els.exportReport.addEventListener("click", exportReport);
  els.loadLoginTime.addEventListener("click", loadLoginTime);
  els.toggleLoggedTimeTickets.addEventListener("change", toggleLoggedTimeTickets);
  els.hideNotStartedNonDevelopment.addEventListener("change", toggleNotStartedNonDevelopment);
  els.hideProcessedResearch.addEventListener("change", toggleProcessedResearch);
  els.dashboardStartDateFrom.addEventListener("change", renderListConditions);
  els.dashboardStartDateTo.addEventListener("change", renderListConditions);
  els.myTaskStartDate.addEventListener("change", renderMyTaskConditions);
  els.myTaskEndDate.addEventListener("change", renderMyTaskConditions);
  els.reportFromDate.addEventListener("change", renderReportConditions);
  els.reportToDate.addEventListener("change", renderReportConditions);
  els.loginUserId.addEventListener("change", handleLoginUserChange);
  els.loginLoggedUserId.addEventListener("change", applyLogTimeLoggedUserFilter);
  els.loginYear.addEventListener("change", renderLoginTimeConditions);
  els.loginMonth.addEventListener("change", renderLoginTimeConditions);
  els.reportRows.addEventListener("change", handleReportSelectionChange);
  els.navItems.forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.view));
  });
}

function handleGlobalIssueSearchInput() {
  globalIssueSearchTerm = normalizeSearchTerm(els.globalIssueSearch.value);
  renderDashboardLists();
  renderDailyReport(loadedDailyReportIssues, !!loadedDailyReportIssues.length);
  renderMyTaskList(loadedMyTaskIssues);
  renderReport(
    loadedReportLists || { hasPrevious: true, prevCsharp: [], prevWeb: [], currentCsharp: [], currentWeb: [] },
    0
  );
  renderLoginTimeList(loadedLoginTimeIssues);
}

function requireRuntimeConfig() {
  const proxyConfigError = getProxyConfigError();
  if (proxyConfigError) {
    throw new Error(proxyConfigError);
  }
  if (!normalizeBaseUrl(getApiBaseUrl())) {
    throw new Error("Redmine API URL is not configured.");
  }
}

function collapseSidebar() {
  els.appLayout.classList.add("sidebar-collapsed");
  els.collapseSidebar.setAttribute("aria-expanded", "false");
}

function expandSidebar() {
  els.appLayout.classList.remove("sidebar-collapsed");
  els.collapseSidebar.setAttribute("aria-expanded", "true");
}

function toggleLoggedTimeTickets() {
  hideLoggedTimeTickets = els.toggleLoggedTimeTickets.checked;
  applyLogTimeLoggedUserFilter();
}

function handleLoginUserChange() {
  syncLoginLoggedUserSelection();
  renderLoginTimeConditions();
  applyLogTimeLoggedUserFilter();
}

function toggleNotStartedNonDevelopment() {
  hideNotStartedNonDevelopment = els.hideNotStartedNonDevelopment.checked;
  renderDashboardList("notStarted");
}

function toggleProcessedResearch() {
  hideProcessedResearch = els.hideProcessedResearch.checked;
  renderDashboardList("processed");
}

function markLoadButtonAsReload(button) {
  button.textContent = "Reload";
}

function beginGlobalLoading() {
  globalLoadingCount += 1;
  document.body.classList.add("is-loading");
}

function endGlobalLoading() {
  globalLoadingCount = Math.max(0, globalLoadingCount - 1);
  if (globalLoadingCount === 0) {
    document.body.classList.remove("is-loading");
  }
}

function switchView(viewName) {
  if (!viewName) {
    return;
  }

  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  els.navGroups.forEach((group) => {
    const item = group.querySelector(".nav-item");
    group.classList.toggle("active", item && item.dataset.view === viewName);
  });
  els.views.forEach((view) => view.classList.remove("active"));

  const targetId =
    viewName === "login-time"
      ? "loginTimeView"
      : viewName === "my-task"
      ? "myTaskView"
      : viewName === "daily-report"
      ? "dailyReportView"
      : viewName === "schema-config"
      ? "schemaConfigView"
      : `${viewName}View`;
  const target = document.querySelector(`#${targetId}`);
  if (target) {
    target.classList.add("active");
  }
}

function renderListConditions() {
  const range = getSelectedDashboardRange();
  els.notStartedStartCondition.textContent = formatReportDate(range.startDate);
  els.notStartedDueCondition.textContent = formatReportDate(range.endDate);
}

function renderDashboardControls() {
  const range = getMyTaskDefaultRange();
  els.dashboardStartDateFrom.value = formatInputDate(range.startDate);
  els.dashboardStartDateTo.value = formatInputDate(range.endDate);
}

function renderMyTaskControls() {
  const range = getMyTaskDefaultRange();
  els.myTaskUserId.innerHTML = ASSIGNEES.map(
    (user) => `<option value="${user.id}" ${user.id === 114 ? "selected" : ""}>${escapeHtml(user.name)}</option>`
  ).join("");
  els.myTaskStartDate.value = formatInputDate(range.startDate);
  els.myTaskEndDate.value = formatInputDate(range.endDate);
}

function renderMyTaskConditions() {
  const range = getSelectedMyTaskRange();
  els.myTaskStartCondition.textContent = formatReportDate(range.startDate);
  els.myTaskEndCondition.textContent = formatReportDate(range.endDate);
}

function renderReportControls() {
  const ranges = getReportDateRanges();
  els.reportFromDate.value = formatInputDate(ranges.previous.monday);
  els.reportToDate.value = formatInputDate(ranges.current.friday);
}

function renderLoginTimeControls() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const years = [];

  for (let year = currentYear - 3; year <= currentYear + 1; year += 1) {
    years.push(year);
  }

  els.loginUserId.innerHTML = [{ id: "ALL", name: "ALL" }]
    .concat(ASSIGNEES)
    .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
    .join("");
  els.loginLoggedUserId.innerHTML = ASSIGNEES.map(
    (item) => `<option value="${item.id}" ${item.id === 114 ? "selected" : ""}>${escapeHtml(item.name)}</option>`
  ).join("");
  els.loginYear.innerHTML = years
    .map((year) => `<option value="${year}" ${year === currentYear ? "selected" : ""}>${year}</option>`)
    .join("");
  els.loginMonth.innerHTML = Array.from({ length: 12 }, (_, index) => index + 1)
    .map((month) => `<option value="${month}" ${month === currentMonth ? "selected" : ""}>${month}</option>`)
    .join("");
}

function renderLoginTimeConditions() {
  const range = getSelectedLoginMonthRange();
  const userLabel = getSelectedLoginUserLabel();
  els.loginTimeTitle.textContent = `Log time for ${range.year}/${pad2(range.month)} - ${userLabel}`;
}

function renderReportConditions() {
  const range = getSelectedReportRange();
  els.reportRangeLabel.textContent = `Report time: ${formatReportDate(range.from)} ~ ${formatReportDate(range.to)}`;
  loadedReportLists = null;
  els.exportReport.disabled = true;
}

function renderInitialEmptyLists() {
  dashboardLists = { processing: [], notStarted: [], processed: [] };
  renderDashboardLists();
  renderDailyReport([]);
  renderMyTaskList([]);
  renderReport({ prevCsharp: [], prevWeb: [], currentCsharp: [], currentWeb: [], hasPrevious: true }, 0);
  renderLoginTimeList([]);
}

function renderDashboardLoading() {
  renderDashboardListLoading("processing");
  renderDashboardListLoading("notStarted");
  renderDashboardListLoading("processed");
}

function renderDashboardListLoading(name) {
  const rowsEl = els[`${name}Rows`];
  const infoEl = els[`${name}Info`];
  rowsEl.innerHTML = `<tr><td colspan="${getDashboardListColspan(name)}" class="empty-cell">Loading data...</td></tr>`;
  infoEl.textContent = "Loading...";
}

function renderMyTaskLoading() {
  els.myTaskRows.innerHTML = '<tr><td colspan="7" class="empty-cell">Loading data...</td></tr>';
}

function renderReportLoading() {
  els.reportRows.innerHTML = '<tr><td colspan="8" class="empty-cell">Loading data...</td></tr>';
}

function renderLoginTimeLoading() {
  els.loginTimeRows.innerHTML = '<tr><td colspan="8" class="empty-cell">Loading data...</td></tr>';
}

async function loadDashboard() {
  switchView("dashboard");
  setStatus("Loading data...");
  beginGlobalLoading();
  els.loadDashboard.disabled = true;
  renderDashboardLoading();

  try {
    requireRuntimeConfig();
    const lists = await fetchDashboardLists();

    dashboardLists = lists;
    renderDashboardLists();
    const total = lists.processing.length + lists.notStarted.length + lists.processed.length;
    markLoadButtonAsReload(els.loadDashboard);
    setStatus(`Loaded ${total} issues from Redmine.`, "ok");
  } catch (error) {
    dashboardLists = { processing: [], notStarted: [], processed: [] };
    renderError(error.message);
    setStatus("Could not load data", "error");
  } finally {
    els.loadDashboard.disabled = false;
    endGlobalLoading();
  }
}

async function reloadDashboardList(name) {
  switchView("dashboard");
  setStatus(`Reloading ${getDashboardListLabel(name)} data...`);
  beginGlobalLoading();
  const button = getDashboardReloadButton(name);
  button.disabled = true;
  renderDashboardListLoading(name);

  try {
    requireRuntimeConfig();
    dashboardLists[name] = await fetchDashboardList(name);
    renderDashboardList(name);
    setStatus(`Reloaded ${getVisibleDashboardIssues(name).length} ${getDashboardListLabel(name)} issues from Redmine.`, "ok");
  } catch (error) {
    renderDashboardListError(name, error.message);
    setStatus(`Could not reload ${getDashboardListLabel(name)} data`, "error");
  } finally {
    button.disabled = false;
    endGlobalLoading();
  }
}

async function loadMyTask() {
  switchView("my-task");
  setStatus("Loading my task data...");
  beginGlobalLoading();
  els.loadMyTask.disabled = true;
  renderMyTaskLoading();

  try {
    requireRuntimeConfig();
    renderMyTaskConditions();
    loadedMyTaskIssues = await fetchMyTaskIssues();
    renderMyTaskList(loadedMyTaskIssues);
    markLoadButtonAsReload(els.loadMyTask);
    setStatus(`Loaded ${loadedMyTaskIssues.length} my task issues from Redmine.`, "ok");
  } catch (error) {
    loadedMyTaskIssues = [];
    renderMyTaskError(error.message);
    setStatus("Could not load my task data", "error");
  } finally {
    els.loadMyTask.disabled = false;
    endGlobalLoading();
  }
}

async function loadDailyReport() {
  switchView("daily-report");
  setStatus("Loading daily report data...");
  beginGlobalLoading();
  els.loadDailyReport.disabled = true;
  els.copyDailyReport.disabled = true;
  els.dailyReportContent.textContent = "Loading data...";

  try {
    requireRuntimeConfig();
    loadedDailyReportIssues = await fetchDailyReportIssues();
    renderDailyReport(loadedDailyReportIssues, true);
    markLoadButtonAsReload(els.loadDailyReport);
    setStatus(`Loaded ${loadedDailyReportIssues.length} daily report issues from Redmine.`, "ok");
  } catch (error) {
    loadedDailyReportIssues = [];
    renderDailyReportError(error.message);
    setStatus("Could not load daily report", "error");
  } finally {
    els.loadDailyReport.disabled = false;
    endGlobalLoading();
  }
}

async function copyDailyReport() {
  const html = `<div style="white-space: pre-wrap; font-family: sans-serif;">${els.dailyReportContent.innerHTML}</div>`;
  const text = buildDailyReportClipboardText();

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    } else if (copyDailyReportSelection()) {
      setStatus("Copied daily report for Slack.", "ok");
      return;
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      copyTextWithTextarea(text);
    }
    setStatus("Copied daily report for Slack.", "ok");
  } catch (error) {
    if (copyDailyReportSelection()) {
      setStatus("Copied daily report for Slack.", "ok");
    } else {
      copyTextWithTextarea(text);
      setStatus("Copied daily report as plain text.", "ok");
    }
  }
}

async function loadReport() {
  switchView("report");
  setStatus("Loading report data...");
  beginGlobalLoading();
  els.loadReport.disabled = true;
  els.exportReport.disabled = true;
  renderReportLoading();

  try {
    requireRuntimeConfig();
    renderReportConditions();
    const lists = await fetchReportLists();
    loadedReportLists = lists;
    const total =
      (lists.prevCsharp || []).length +
      (lists.prevWeb || []).length +
      (lists.currentCsharp || []).length +
      (lists.currentWeb || []).length;
    renderReport(lists, total);
    els.exportReport.disabled = false;
    markLoadButtonAsReload(els.loadReport);
    setStatus(`Loaded ${total} report issues from Redmine.`, "ok");
  } catch (error) {
    loadedReportLists = null;
    renderReportError(error.message);
    setStatus("Could not load report data", "error");
  } finally {
    els.loadReport.disabled = false;
    endGlobalLoading();
  }
}

function exportReport() {
  if (!loadedReportLists) {
    return;
  }
  if (!window.XLSX || !window.XLSX.utils || !window.XLSX.writeFile) {
    setStatus("Could not export Excel file. XLSX library is not loaded.", "error");
    return;
  }

  const exportRange = loadedReportLists.exportRange || getWeeklyReportExportRange();
  const rangeLabel = formatMonthDayRange(exportRange.from, exportRange.to);
  const sheetName = `Report (${rangeLabel})`;
  const reportTitle = `週報（${formatJapaneseDateRange(exportRange.from, exportRange.to)}）`;
  const sheet = buildReportSheet(getSelectedReportLists(), reportTitle);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  window.XLSX.writeFile(workbook, `WDM_Weekly_Report_${formatTimestamp(new Date())}.xlsx`);
  setStatus("Exported report Excel file.", "ok");
}

async function loadLoginTime() {
  switchView("login-time");
  setStatus("Loading log time data...");
  beginGlobalLoading();
  els.loadLoginTime.disabled = true;
  renderLoginTimeLoading();

  try {
    requireRuntimeConfig();

    renderLoginTimeConditions();
    loadedLoginTimeIssues = await fetchLoginTimeIssues();
    hideLoggedTimeTickets = false;
    els.toggleLoggedTimeTickets.checked = false;
    renderLoginTimeList(loadedLoginTimeIssues);
    markLoadButtonAsReload(els.loadLoginTime);
    setStatus(`Loaded ${loadedLoginTimeIssues.length} log time issues from Redmine.`, "ok");
  } catch (error) {
    loadedLoginTimeIssues = [];
    renderLoginTimeError(error.message);
    setStatus("Could not load log time data", "error");
  } finally {
    els.loadLoginTime.disabled = false;
    endGlobalLoading();
  }
}

async function fetchReportLists() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Redmine API URL is not configured.");
  }

  const ranges = getSelectedReportRanges();
  const csharpAssigneeIds = [106, 94, 99];
  const webAssigneeIds = [123];
  const currentPromises = [
    fetchCurrentCsharpReportList(csharpAssigneeIds, ranges.current),
    fetchReportList({ assigneeIds: webAssigneeIds, range: ranges.current }),
  ];
  const previousPromises = ranges.hasPrevious
    ? [
        fetchReportList({ assigneeIds: csharpAssigneeIds, range: ranges.previous }),
        fetchReportList({ assigneeIds: webAssigneeIds, range: ranges.previous }),
      ]
    : [Promise.resolve([]), Promise.resolve([])];

  const [prevCsharp, prevWeb, currentCsharp, currentWeb] = await Promise.all(
    previousPromises.concat(currentPromises)
  );

  return {
    prevCsharp,
    prevWeb,
    currentCsharp,
    currentWeb,
    hasPrevious: ranges.hasPrevious,
    range: ranges.selected,
    exportRange: { from: ranges.selected.from, to: ranges.previous.friday },
  };
}

async function fetchCurrentCsharpReportList(assigneeIds, range) {
  const [teamIssues, user114Issues] = await Promise.all([
    fetchReportList({ assigneeIds, range }),
    fetchReportList({
      assigneeIds: [114],
      range,
      issueFilter: (issue) => getTrackerName(issue) === TRACKER_NAMES.development,
    }),
  ]);

  return sortIssues(uniqueIssues(teamIssues.concat(user114Issues)));
}

async function fetchReportList({ assigneeIds, range, dueDateFrom, issueFilter }) {
  const issues = await fetchIssuesForAssigneeIds(assigneeIds, {
    statusId: "*",
    startDateTo: range.friday,
    dueDateFrom: dueDateFrom || range.monday,
  });
  const filteredIssues = issues.filter(isWorkItemStatusIssue).filter(issueFilter || (() => true));
  const sortedIssues = sortIssues(filteredIssues);
  const spentHoursByIssueId = await fetchSpentHoursForIssues(sortedIssues, {
    from: range.monday,
    to: range.friday,
  });

  return sortedIssues.map((issue) =>
    Object.assign({}, issue, {
      reportSpentHours: spentHoursByIssueId.get(Number(issue.id)) || 0,
    })
  );
}

function buildReportSheet(lists, reportTitle) {
  const rows = [];
  const styles = {};
  const merges = [];
  const headers = ["No", "クライアント名", "チケットID", "タイトル", "課題", "ステータス", "開始日", "終了日"];

  function setCell(row, col, value, style) {
    if (!rows[row]) {
      rows[row] = [];
    }
    rows[row][col] = value;
    if (style) {
      styles[window.XLSX.utils.encode_cell({ r: row, c: col })] = style;
    }
  }

  function addHeader(row) {
    headers.forEach((header, index) => setCell(row, index + 1, header, 3));
  }

  function addTeamTitle(row, title) {
    setCell(row, 1, title, 4);
    merges.push({ s: { r: row, c: 1 }, e: { r: row, c: 8 } });
  }

  function addIssueRows(startRow, issues) {
    const exportIssues = issues.length ? issues : [null];
    exportIssues.forEach((issue, index) => {
      const row = startRow + index;
      const values = [
        index + 1,
        issue && issue.project ? issue.project.name || "" : "",
        issue ? { text: Number(issue.id) || "", hyperlink: `https://redmine.wdm.co.jp/issues/${issue.id}` } : "",
        issue ? issue.subject || "" : "",
        "",
        issue && issue.status ? issue.status.name || "" : "",
        issue ? formatExcelDate(issue.start_date) : "",
        issue ? formatExcelDate(issue.due_date) : "",
      ];
      values.forEach((value, colIndex) => {
        const style = colIndex === 2 ? 7 : colIndex === 6 || colIndex === 7 ? 6 : 5;
        setCell(row, colIndex + 1, value, style);
      });
    });
    return startRow + exportIssues.length;
  }

  function addTaskBlock(startRow, sectionTitle, csharpIssues, webIssues) {
    let row = startRow;
    setCell(row, 0, sectionTitle, 2);
    row += 1;
    addHeader(row);
    row += 1;
    addTeamTitle(row, "C#開発");
    row += 1;
    row = addIssueRows(row, csharpIssues);
    addTeamTitle(row, "WEB開発");
    row += 1;
    row = addIssueRows(row, webIssues);
    return row;
  }

  setCell(1, 0, reportTitle, 1);
  let nextRow = 3;
  if (lists.hasPrevious) {
    nextRow = addTaskBlock(nextRow, "■先週の作業", lists.prevCsharp || [], lists.prevWeb || []);
    nextRow += 3;
  }
  addTaskBlock(nextRow, "◆今週の計画", lists.currentCsharp || [], lists.currentWeb || []);

  const sheet = window.XLSX.utils.aoa_to_sheet(rows);
  Object.keys(styles).forEach((address) => {
    if (!sheet[address]) {
      sheet[address] = { t: "s", v: "" };
    }
    sheet[address].s = styles[address];
  });
  sheet["!merges"] = merges;
  sheet["!cols"] = [4.5, 4.5, 18, 10, 45, 30, 10, 9.5, 9.5].map(reportColumnWidth);
  sheet["!rows"] = [];
  sheet["!rows"][1] = { hpt: 18 };
  return sheet;
}

function reportColumnWidth(wch) {
  return {
    wch,
    width: convertCharsToExcelColumnWidth(wch),
    customWidth: 1,
  };
}

function convertCharsToExcelColumnWidth(wch) {
  return Math.trunc(((wch * 7 + 5) / 7) * 256) / 256;
}

async function fetchDashboardLists() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Redmine API URL is not configured.");
  }

  const statusIds = await fetchStatusIds();
  const range = getSelectedDashboardRange();
  validateDateRange(range.startDate, range.endDate);
  releaseTargetValueNames = await fetchCustomFieldValueNameMap(RELEASE_TARGET_FIELD_NAME).catch(() => new Map());

  const [processing, notStarted, processed] = await Promise.all([
    fetchDashboardListIssues("processing", statusIds, range),
    fetchDashboardListIssues("notStarted", statusIds, range),
    fetchDashboardListIssues("processed", statusIds, range),
  ]);

  return {
    processing,
    notStarted,
    processed,
  };
}

async function fetchDashboardList(name) {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Redmine API URL is not configured.");
  }

  const statusIds = await fetchStatusIds();
  const range = getSelectedDashboardRange();
  validateDateRange(range.startDate, range.endDate);
  if (name === "processed") {
    releaseTargetValueNames = await fetchCustomFieldValueNameMap(RELEASE_TARGET_FIELD_NAME).catch(() => new Map());
  }
  return fetchDashboardListIssues(name, statusIds, range);
}

async function fetchDashboardListIssues(name, statusIds, range) {
  if (name === "processing") {
    const issues = await fetchIssuesForAssignees({
      statusId: statusIds.processing,
    });
    return sortIssues(issues.filter((issue) => Number(issue.done_ratio) < 100));
  }

  if (name === "notStarted") {
    const issues = await fetchIssuesForAssignees({
      statusId: statusIds.notStarted,
      startDateFrom: range.startDate,
      startDateTo: range.endDate,
    });
    return sortNotStartedIssues(issues);
  }

  if (name === "processed") {
    const [processedIssues, completedProcessingIssues] = await Promise.all([
      fetchIssuesForAssignees({
        statusId: statusIds.processed,
      }),
      fetchIssuesForAssignees({
        statusId: statusIds.processing,
      }),
    ]);
    return sortIssuesDescending(
      uniqueIssues(
        processedIssues
          .filter((issue) => Number(issue.done_ratio) === 90)
          .concat(completedProcessingIssues.filter((issue) => Number(issue.done_ratio) === 100))
      )
    );
  }

  throw new Error(`Unknown dashboard list: ${name}`);
}

async function fetchDailyReportIssues() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Redmine API URL is not configured.");
  }

  const today = startOfDay(new Date());
  const statusIds = await fetchStatusIds();
  const assigneeIds = DAILY_REPORT_ASSIGNEES.map((item) => item.id);
  const [todayIssues, processingIssues, otherIssues] = await Promise.all([
    fetchIssuesForAssigneeIds(assigneeIds, {
      statusId: "*",
      startDateFrom: today,
      startDateTo: today,
    }),
    fetchIssuesForAssigneeIds(assigneeIds, {
      statusId: statusIds.processing,
    }),
    fetchIssuesForAssigneeIds([DAILY_REPORT_OTHER.assigneeId], {
      statusId: "*",
      startDateTo: today,
    }),
  ]);

  const filteredTodayIssues = todayIssues.filter(
    (issue) => Number(issue.assigned_to && issue.assigned_to.id) !== DAILY_REPORT_OTHER.assigneeId
  );
  const filteredProcessingIssues = processingIssues.filter((issue) => Number(issue.done_ratio) <= 90);
  const filteredOtherIssues = otherIssues.filter(
    (issue) =>
      Number(issue.assigned_to && issue.assigned_to.id) === DAILY_REPORT_OTHER.assigneeId &&
      getTrackerName(issue) === DAILY_REPORT_OTHER.tracker &&
      dateLte(issue.start_date, today) &&
      ["処理中", "未対応"].includes((issue.status && issue.status.name) || "")
  );

  return sortIssues(uniqueIssues(filteredTodayIssues.concat(filteredProcessingIssues, filteredOtherIssues)));
}

async function fetchMyTaskIssues() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Redmine API URL is not configured.");
  }

  const range = getSelectedMyTaskRange();
  validateDateRange(range.startDate, range.endDate);
  const assigneeId = Number(els.myTaskUserId.value);
  const issues = await fetchIssuesForAssigneeIds([assigneeId], {
    statusId: "*",
    startDateFrom: range.startDate,
    startDateTo: range.endDate,
  });

  return sortIssues(
    issues.filter((issue) => isMyTaskIssue(issue) && dateGte(issue.start_date, range.startDate) && dateLte(issue.start_date, range.endDate))
  );
}

async function fetchLoginTimeIssues() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Redmine API URL is not configured.");
  }

  const range = getSelectedLoginMonthRange();
  const assigneeIds = getSelectedLoginAssigneeIds();
  const issues = await fetchIssuesForAssigneeIds(assigneeIds, {
    statusId: "*",
    startDateTo: range.monthEnd,
    dueDateFrom: range.monthStart,
  });
  const sortedIssues = sortIssues(issues.filter(isLoginTimeIssue));
  const spentDetailsByIssueId = await fetchSpentDetailsForIssues(sortedIssues, {
    from: range.monthStart,
    to: range.monthEnd,
  });

  return sortedIssues.map((issue) =>
    Object.assign({}, issue, {
      loginSpentHours: (spentDetailsByIssueId.get(Number(issue.id)) || {}).hours || 0,
      loginSpentEntries: (spentDetailsByIssueId.get(Number(issue.id)) || {}).entries || [],
      spentUserIds: getSpentUserIds(spentDetailsByIssueId.get(Number(issue.id)) || {}),
    })
  );
}

async function fetchStatusIds() {
  if (STATUS_IDS.processing && STATUS_IDS.notStarted && STATUS_IDS.processed) {
    return STATUS_IDS;
  }

  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  const url = new URL(`${apiBaseUrl}/issue_statuses.json`);
  const data = await redmineGet(url);
  const statuses = Array.isArray(data.issue_statuses) ? data.issue_statuses : [];

  const findId = (statusName) => {
    const status = statuses.find((item) => item.name === statusName);
    if (!status) {
      throw new Error(`Could not find status "${statusName}" in Redmine.`);
    }
    return status.id;
  };

  return {
    processing: findId(ISSUE_STATUS.processing.name),
    notStarted: findId(ISSUE_STATUS.notStarted.name),
    processed: findId(ISSUE_STATUS.processed.name),
  };
}

async function fetchCustomFieldValueNameMap(fieldName) {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  const url = new URL(`${apiBaseUrl}/custom_fields.json`);
  const data = await redmineGet(url);
  const fields = Array.isArray(data.custom_fields) ? data.custom_fields : [];
  const field = fields.find((item) => item.name === fieldName);
  const map = new Map();

  if (!field || !Array.isArray(field.possible_values)) {
    return map;
  }

  field.possible_values.forEach((item) => {
    if (typeof item === "string") {
      map.set(item, item);
      return;
    }
    if (!item || typeof item !== "object") {
      return;
    }
    const value = item.value != null ? item.value : item.id != null ? item.id : item.name;
    const name = item.label || item.name || item.text || item.value;
    if (value != null && name != null) {
      map.set(String(value), String(name));
    }
  });

  return map;
}

async function fetchIssuesForAssignees(filters) {
  return fetchIssuesForAssigneeIds(Array.from(dashboardAssigneeIdSet), filters);
}

async function fetchIssuesForAssigneeIds(assigneeIds, filters) {
  const results = await Promise.all(
    assigneeIds.map((assigneeId) => fetchIssuePages(Object.assign({}, filters, { assigneeId })))
  );
  return uniqueIssues([].concat.apply([], results));
}

async function fetchIssuePages({ statusId, assigneeId, startDateFrom, startDateTo, dueDateFrom, dueDateTo }) {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  const allIssues = [];
  const limit = 100;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url = new URL(`${apiBaseUrl}/issues.json`);
    if (statusId) {
      url.searchParams.set("status_id", String(statusId));
    }
    url.searchParams.set("assigned_to_id", String(assigneeId));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("sort", "start_date:asc,due_date:asc,id:asc");
    if (startDateFrom && startDateTo) {
      url.searchParams.set("start_date", `><${formatApiDate(startDateFrom)}|${formatApiDate(startDateTo)}`);
    } else if (startDateFrom) {
      url.searchParams.set("start_date", `>=${formatApiDate(startDateFrom)}`);
    } else if (startDateTo) {
      url.searchParams.set("start_date", `<=${formatApiDate(startDateTo)}`);
    }
    if (dueDateFrom && dueDateTo) {
      url.searchParams.set("due_date", `><${formatApiDate(dueDateFrom)}|${formatApiDate(dueDateTo)}`);
    } else if (dueDateFrom) {
      url.searchParams.set("due_date", `>=${formatApiDate(dueDateFrom)}`);
    } else if (dueDateTo) {
      url.searchParams.set("due_date", `<=${formatApiDate(dueDateTo)}`);
    }

    const data = await redmineGet(url);
    const pageIssues = Array.isArray(data.issues) ? data.issues : [];
    Array.prototype.push.apply(allIssues, pageIssues);

    total = Number(data.total_count) || allIssues.length;
    if (!pageIssues.length) {
      break;
    }
    offset += limit;
  }

  return allIssues;
}

async function fetchSpentHoursForIssues(issues, { from, to, userId } = {}) {
  const detailsByIssueId = await fetchSpentDetailsForIssues(issues, { from, to, userId });
  const result = new Map();

  detailsByIssueId.forEach((details, issueId) => {
    result.set(issueId, details.hours);
  });

  return result;
}

async function fetchSpentDetailsForIssues(issues, { from, to, userId } = {}) {
  const issueIds = new Set(issues.map((issue) => Number(issue.id)));
  const entries = await fetchTimeEntryPages({
    userId,
    spentFrom: from,
    spentTo: to,
  });
  const result = new Map();

  sortTimeEntries(entries).forEach((entry) => {
    const issueId = Number(entry.issue && entry.issue.id);
    if (!issueIds.has(issueId)) {
      return;
    }
    const hours = Number(entry.hours) || 0;
    const current = result.get(issueId) || { hours: 0, entries: [] };
    current.hours += hours;
    current.entries.push(entry);
    result.set(issueId, current);
  });

  return result;
}

async function fetchTimeEntryPages({ issueId, userId, spentFrom, spentTo }) {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  const allEntries = [];
  const limit = 100;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url = new URL(`${apiBaseUrl}/time_entries.json`);
    url.searchParams.set("from", formatApiDate(spentFrom));
    url.searchParams.set("to", formatApiDate(spentTo));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    if (userId) {
      url.searchParams.set("user_id", String(userId));
    }
    if (issueId) {
      url.searchParams.set("issue_id", String(issueId));
    }

    const data = await redmineGet(url);
    const pageEntries = Array.isArray(data.time_entries) ? data.time_entries : [];
    Array.prototype.push.apply(allEntries, pageEntries);

    total = Number(data.total_count) || allEntries.length;
    if (!pageEntries.length) {
      break;
    }
    offset += limit;
  }

  return allEntries;
}

async function redmineGet(url) {
  const response = await safeFetch(url);

  if (response.ok) {
    return response.json();
  }

  throw buildHttpError(response, url);
}

async function safeFetch(url, options) {
  const invalidRequestMessage = getInvalidRequestUrlMessage(url);
  if (invalidRequestMessage) {
    throw new Error(invalidRequestMessage);
  }

  try {
    return await fetch(url, options);
  } catch (error) {
    throw new Error(getFetchFailureMessage(url));
  }
}

function buildHttpError(response, url) {
  if (response.status === 401) {
    return new Error(
      `The API returned HTTP 401 at ${url.pathname}. Check the Cloudflare Worker secrets or Redmine authentication.`
    );
  }

  if (response.status === 0) {
    return new Error("The browser blocked the request. Redmine may not have CORS enabled for this page.");
  }

  return new Error(`The API returned HTTP ${response.status} at ${url.pathname}.`);
}

function isProxyRequest(url) {
  const proxyUrl = normalizeBaseUrl(REDMINE.proxyUrl);
  return proxyUrl && url.toString().startsWith(proxyUrl);
}

function getInvalidRequestUrlMessage(url) {
  if (isProxyRequest(url) && url.protocol !== "https:") {
    return "Proxy URL must use HTTPS. Update REDMINE.proxyUrl in app.js.";
  }
  if (window.location.protocol === "https:" && url.protocol === "http:") {
    return "This HTTPS page cannot call an HTTP API. Use an HTTPS Redmine URL or configure the Cloudflare Worker HTTPS proxy.";
  }
  return "";
}

function getFetchFailureMessage(url) {
  if (window.location.protocol === "https:" && !isProxyRequest(url)) {
    return `The browser could not call ${url.pathname} from GitHub Pages. Redmine likely does not allow CORS from this page. Configure the Cloudflare Worker HTTPS proxy.`;
  }

  if (isProxyRequest(url)) {
    return `Could not call the configured HTTPS proxy at ${url.pathname}. Check that the Cloudflare Worker URL is deployed and reachable.`;
  }

  return `Could not call the API at ${url.pathname}. If Redmine blocks browser CORS, configure the Cloudflare Worker HTTPS proxy.`;
}

function getProxyConfigError() {
  const proxyUrl = normalizeBaseUrl(REDMINE.proxyUrl);
  if (!proxyUrl) {
    return "";
  }

  try {
    const url = new URL(proxyUrl);
    return url.protocol === "https:" ? "" : "Proxy URL must use HTTPS. Update REDMINE.proxyUrl in app.js.";
  } catch (error) {
    return "Proxy URL is invalid. Update REDMINE.proxyUrl in app.js.";
  }
}

function isStatus(issue, statusName) {
  return ((issue.status && issue.status.name) || "").trim() === statusName;
}

function uniqueIssues(issues) {
  const seen = new Set();
  return issues.filter((issue) => {
    if (seen.has(issue.id)) {
      return false;
    }
    seen.add(issue.id);
    return true;
  });
}

function isLoginTimeIssue(issue) {
  return isWorkItemStatusIssue(issue) && Number(issue.done_ratio) > 0;
}

function isMyTaskIssue(issue) {
  return !MY_TASK_EXCLUDED_STATUS_NAMES.has(((issue.status && issue.status.name) || "").trim());
}

function isWorkItemStatusIssue(issue) {
  return WORK_ITEM_STATUS_NAMES.has(((issue.status && issue.status.name) || "").trim());
}

function getCustomFieldValue(issue, fieldName) {
  const field = findCustomField(issue, fieldName);
  if (!field) {
    return "";
  }
  if (Array.isArray(field.value)) {
    return field.value.filter(Boolean).join(", ");
  }
  return field.value || "";
}

function getCustomFieldDisplayValue(issue, fieldName) {
  const field = findCustomField(issue, fieldName);
  if (!field) {
    return "";
  }

  const displayValue = field.display_value || field.value_name || field.label;
  if (displayValue) {
    return Array.isArray(displayValue) ? displayValue.filter(Boolean).join(", ") : String(displayValue);
  }

  const rawValues = Array.isArray(field.value) ? field.value : [field.value];
  return rawValues
    .map((item) => getCustomFieldItemDisplayValue(issue, item))
    .filter(Boolean)
    .join(", ");
}

function findCustomField(issue, fieldName) {
  const fields = Array.isArray(issue.custom_fields) ? issue.custom_fields : [];
  return fields.find((item) => item.name === fieldName);
}

function getCustomFieldItemDisplayValue(issue, item) {
  if (item == null || item === "") {
    return "";
  }
  if (typeof item === "object") {
    const objectValue = item.label || item.name || item.text || item.value;
    return objectValue == null ? "" : String(objectValue);
  }

  const value = String(item);
  if (RELEASE_TARGET_VALUE_NAMES.has(value)) {
    return RELEASE_TARGET_VALUE_NAMES.get(value);
  }
  if (releaseTargetValueNames.has(value)) {
    return releaseTargetValueNames.get(value);
  }
  if (issue.fixed_version && String(issue.fixed_version.id) === value) {
    return issue.fixed_version.name || value;
  }
  return value;
}

function getSpentUserIds(details) {
  const entries = details.entries || [];
  return Array.from(
    new Set(entries.map((entry) => Number(entry.user && entry.user.id)).filter((userId) => Number.isFinite(userId)))
  );
}

function sortIssues(issues) {
  return issues.slice().sort((a, b) => {
    const startDiff = compareDate(a.start_date, b.start_date);
    if (startDiff !== 0) return startDiff;

    const dueDiff = compareDate(a.due_date, b.due_date);
    if (dueDiff !== 0) return dueDiff;

    return Number(a.id || 0) - Number(b.id || 0);
  });
}

function sortNotStartedIssues(issues) {
  return issues.slice().sort((a, b) => {
    const trackerDiff = getNotStartedTrackerRank(a) - getNotStartedTrackerRank(b);
    if (trackerDiff !== 0) return trackerDiff;

    const trackerNameDiff = getTrackerName(a).localeCompare(getTrackerName(b), "ja");
    if (trackerNameDiff !== 0) return trackerNameDiff;

    const startDiff = compareDate(a.start_date, b.start_date);
    if (startDiff !== 0) return startDiff;

    const dueDiff = compareDate(a.due_date, b.due_date);
    if (dueDiff !== 0) return dueDiff;

    return Number(a.id || 0) - Number(b.id || 0);
  });
}

function getNotStartedTrackerRank(issue) {
  return getTrackerName(issue) === "開発" ? 0 : 1;
}

function getTrackerName(issue) {
  return ((issue.tracker && issue.tracker.name) || "").trim();
}

function sortIssuesDescending(issues) {
  return issues.slice().sort((a, b) => {
    const startDiff = compareDate(b.start_date, a.start_date);
    if (startDiff !== 0) return startDiff;

    const dueDiff = compareDate(b.due_date, a.due_date);
    if (dueDiff !== 0) return dueDiff;

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function sortTimeEntries(entries) {
  return entries.slice().sort((a, b) => {
    const spentDiff = compareDate(a.spent_on, b.spent_on);
    if (spentDiff !== 0) return spentDiff;

    const userDiff = String((a.user && a.user.name) || "").localeCompare(String((b.user && b.user.name) || ""));
    if (userDiff !== 0) return userDiff;

    return String((a.activity && a.activity.name) || "").localeCompare(String((b.activity && b.activity.name) || ""));
  });
}

function compareDate(a, b) {
  const aTime = a ? new Date(a).getTime() : Number.MAX_SAFE_INTEGER;
  const bTime = b ? new Date(b).getTime() : Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}

function getDashboardDateRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDay = today.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMonday);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const nextFriday = new Date(thisMonday);
  nextFriday.setDate(thisMonday.getDate() + 11);

  return { lastMonday, nextFriday };
}

function getPreviousWeekRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDay = today.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - daysFromMonday);

  const previousMonday = new Date(currentMonday);
  previousMonday.setDate(currentMonday.getDate() - 7);

  const previousFriday = new Date(previousMonday);
  previousFriday.setDate(previousMonday.getDate() + 4);

  return { monday: previousMonday, friday: previousFriday };
}

function getMyTaskDefaultRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDay = today.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - daysFromMonday);

  const previousMonday = new Date(currentMonday);
  previousMonday.setDate(currentMonday.getDate() - 7);

  const nextFriday = new Date(currentMonday);
  nextFriday.setDate(currentMonday.getDate() + 11);

  return { startDate: previousMonday, endDate: nextFriday };
}

function getReportDateRanges() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDay = today.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - daysFromMonday);

  const currentFriday = new Date(currentMonday);
  currentFriday.setDate(currentMonday.getDate() + 4);

  const previousMonday = new Date(currentMonday);
  previousMonday.setDate(currentMonday.getDate() - 7);

  const previousFriday = new Date(previousMonday);
  previousFriday.setDate(previousMonday.getDate() + 4);

  return {
    previous: { monday: previousMonday, friday: previousFriday },
    current: { monday: currentMonday, friday: currentFriday },
  };
}

function getSelectedLoginMonthRange() {
  const year = Number(els.loginYear.value);
  const month = Number(els.loginMonth.value);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  monthStart.setHours(0, 0, 0, 0);
  monthEnd.setHours(0, 0, 0, 0);
  return { year, month, monthStart, monthEnd };
}

function getSelectedLoginAssigneeIds() {
  const selectedUserId = els.loginUserId.value;
  if (!selectedUserId || selectedUserId === "ALL") {
    return DASHBOARD_ASSIGNEE_IDS.slice();
  }
  return [Number(selectedUserId)];
}

function getSelectedLoginUserLabel() {
  const selectedOption = els.loginUserId.options[els.loginUserId.selectedIndex];
  return selectedOption ? selectedOption.textContent : "ALL";
}

function syncLoginLoggedUserSelection() {
  const selectedUserId = els.loginUserId.value;
  if (selectedUserId && selectedUserId !== "ALL") {
    els.loginLoggedUserId.value = selectedUserId;
  }
}

function getSelectedMyTaskRange() {
  return {
    startDate: parseInputDate(els.myTaskStartDate.value),
    endDate: parseInputDate(els.myTaskEndDate.value),
  };
}

function getSelectedDashboardRange() {
  return {
    startDate: parseInputDate(els.dashboardStartDateFrom.value),
    endDate: parseInputDate(els.dashboardStartDateTo.value),
  };
}

function getSelectedReportRange() {
  return {
    from: parseInputDate(els.reportFromDate.value),
    to: parseInputDate(els.reportToDate.value),
  };
}

function getWeeklyReportExportRange() {
  const ranges = getSelectedReportRanges();
  return { from: ranges.selected.from, to: ranges.previous.friday };
}

function getSelectedReportRanges() {
  const selected = getSelectedReportRange();
  validateReportRange(selected);

  const toWeekMonday = getMondayOfWeek(selected.to);
  const previousFriday = new Date(toWeekMonday);
  previousFriday.setDate(toWeekMonday.getDate() - 3);
  const hasPrevious = selected.from.getTime() < toWeekMonday.getTime();

  return {
    selected,
    hasPrevious,
    previous: { monday: selected.from, friday: previousFriday },
    current: { monday: toWeekMonday, friday: selected.to },
  };
}

function validateReportRange(range) {
  if (!range.from || !range.to) {
    throw new Error("Please select both report From and To dates.");
  }
  if (range.from.getDay() !== 1) {
    throw new Error("Report From date must be Monday.");
  }
  if (range.to.getDay() !== 5) {
    throw new Error("Report To date must be Friday.");
  }
  if (range.from.getTime() >= range.to.getTime()) {
    throw new Error("Report From date must be before To date.");
  }
}

function getMondayOfWeek(value) {
  const date = startOfDay(value);
  const currentDay = date.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  date.setDate(date.getDate() - daysFromMonday);
  return date;
}

function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    throw new Error("Please select both start date values.");
  }
  if (startDate.getTime() > endDate.getTime()) {
    throw new Error("Start date from must be before or equal to start date to.");
  }
}

function parseInputDate(value) {
  if (!value) {
    return null;
  }
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return null;
  }
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateGte(value, targetDate) {
  if (!value) {
    return false;
  }
  return startOfDay(value).getTime() >= targetDate.getTime();
}

function dateLte(value, targetDate) {
  if (!value) {
    return false;
  }
  return startOfDay(value).getTime() <= targetDate.getTime();
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeSearchTerm(value) {
  return String(value || "").trim().toLowerCase();
}

function buildIssueSearchText(issue) {
  if (!issue) {
    return "";
  }
  return [
    issue.id,
    issue.subject,
    issue.project && issue.project.name,
    issue.assigned_to && issue.assigned_to.name,
  ]
    .filter((value) => value != null && String(value).trim() !== "")
    .map((value) => String(value).toLowerCase())
    .join(" ");
}

function issueMatchesSearch(issue, term) {
  if (!term) {
    return true;
  }
  return buildIssueSearchText(issue).includes(term);
}

function filterIssuesBySearch(issues) {
  const term = globalIssueSearchTerm;
  return (issues || []).filter((issue) => issueMatchesSearch(issue, term));
}

function highlightSearchText(value) {
  const text = value == null || value === "" ? "-" : String(value);
  const safeText = escapeHtml(text);
  const term = globalIssueSearchTerm;
  if (!term) {
    return safeText;
  }
  const escapedTerm = escapeRegExp(escapeHtml(term));
  if (!escapedTerm) {
    return safeText;
  }
  return safeText.replace(new RegExp(escapedTerm, "ig"), (match) => `<mark class="search-highlight">${match}</mark>`);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function filterReportListsBySearch(lists) {
  const filtered = Object.assign({}, lists);
  ["prevCsharp", "prevWeb", "currentCsharp", "currentWeb"].forEach((name) => {
    filtered[name] = filterIssuesBySearch(filtered[name] || []);
  });
  return filtered;
}

function renderDashboardLists() {
  renderDashboardList("processing");
  renderDashboardList("notStarted");
  renderDashboardList("processed");
  if (typeof renderUpdatedSection === "function") {
    renderUpdatedSection();
  }
}

function renderDashboardList(name) {
  renderList(name, filterIssuesBySearch(getVisibleDashboardIssues(name)));
}

function getVisibleDashboardIssues(name) {
  const issues = dashboardLists[name] || [];
  if (name === "notStarted" && hideNotStartedNonDevelopment) {
    return issues.filter((issue) => getTrackerName(issue) === TRACKER_NAMES.development);
  }
  if (name === "processed" && hideProcessedResearch) {
    return issues.filter((issue) => getTrackerName(issue) !== TRACKER_NAMES.research);
  }
  return issues;
}

function getDashboardListColspan(name) {
  return name === "processing" ? 9 : 10;
}

function getDashboardReloadButton(name) {
  return {
    processing: els.reloadProcessing,
    notStarted: els.reloadNotStarted,
    processed: els.reloadProcessed,
  }[name];
}

function getDashboardListLabel(name) {
  return {
    processing: "Processing",
    notStarted: "Not started",
    processed: "Processed",
  }[name];
}

function renderList(name, issues) {
  const rowsEl = els[`${name}Rows`];
  const countEl = els[`${name}Count`];
  const infoEl = els[`${name}Info`];

  countEl.textContent = issues.length;
  infoEl.textContent = `${issues.length} issue`;

  if (!issues.length) {
    const colspan = getDashboardListColspan(name);
    rowsEl.innerHTML = `<tr><td colspan="${colspan}" class="empty-cell">No matching issues.</td></tr>`;
    return;
  }

  const rowRendererByList = {
    processing: issueRow,
    notStarted: notStartedIssueRow,
    processed: processedIssueRow,
  };
  rowsEl.innerHTML = issues.map(rowRendererByList[name]).join("");
}

function renderMyTaskList(issues) {
  const filteredIssues = filterIssuesBySearch(issues);
  els.myTaskInfo.textContent = `${filteredIssues.length} issue`;

  if (!filteredIssues.length) {
    els.myTaskRows.innerHTML = '<tr><td colspan="7" class="empty-cell">No matching issues.</td></tr>';
    return;
  }

  els.myTaskRows.innerHTML = filteredIssues.map(myTaskRow).join("");
}

function renderDailyReport(issues, isLoaded = false) {
  const filteredIssues = filterIssuesBySearch(issues);
  const groupedIssues = groupDailyReportIssues(filteredIssues);
  els.dailyReportInfo.textContent = `${filteredIssues.length} issue`;
  els.dailyReportContent.innerHTML = buildDailyReportHtml(groupedIssues);
  els.copyDailyReport.disabled = !isLoaded;
}

function groupDailyReportIssues(issues) {
  const groups = new Map(DAILY_REPORT_ASSIGNEES.map((assignee) => [assignee.id, []]));
  groups.set(DAILY_REPORT_OTHER.key, []);

  issues.forEach((issue) => {
    const assigneeId = Number(issue.assigned_to && issue.assigned_to.id);
    if (groups.has(assigneeId)) {
      groups.get(assigneeId).push(issue);
    } else if (assigneeId === DAILY_REPORT_OTHER.assigneeId && getTrackerName(issue) === DAILY_REPORT_OTHER.tracker) {
      groups.get(DAILY_REPORT_OTHER.key).push(issue);
    }
  });

  groups.forEach((items, assigneeId) => {
    groups.set(assigneeId, sortIssues(items));
  });

  return groups;
}

function buildDailyReportHtml(groupedIssues) {
  const today = new Date();
  const lines = [
    "お疲れ様です。",
    `${today.getMonth() + 1}月${today.getDate()}日の対応予定を報告いたします。`,
    "",
  ];

  DAILY_REPORT_ASSIGNEES.forEach((assignee, assigneeIndex) => {
    lines.push(`■${escapeHtml(assignee.name)}`);
    const issues = groupedIssues.get(assignee.id) || [];

    issues.forEach((issue, index) => {
      const number = CIRCLED_NUMBERS[index] || `${index + 1}.`;
      lines.push(
        `${number}<a href="${escapeAttr(getIssueUrl(issue))}" target="_blank" rel="noreferrer">${escapeHtml(
          issue.subject || "-"
        )} - ${escapeHtml((issue.project && issue.project.name) || "-")}</a>`
      );
    });

    if (assigneeIndex < DAILY_REPORT_ASSIGNEES.length - 1) {
      lines.push("");
    }
  });

  const otherIssues = groupedIssues.get(DAILY_REPORT_OTHER.key) || [];
  if (otherIssues.length) {
    lines.push("", "■その他");
    otherIssues.forEach((issue, index) => {
      const number = CIRCLED_NUMBERS[index] || `${index + 1}.`;
      lines.push(
        `${number}<a href="${escapeAttr(getIssueUrl(issue))}" target="_blank" rel="noreferrer">${escapeHtml(
          issue.subject || "-"
        )} - ${escapeHtml((issue.project && issue.project.name) || "-")}</a>`
      );
    });
  }

  return lines.join("\n");
}

function buildDailyReportClipboardText() {
  const clone = els.dailyReportContent.cloneNode(true);
  clone.querySelectorAll("a").forEach((link) => {
    link.textContent = `${link.textContent} ${link.href}`;
  });
  return clone.innerText;
}

function copyTextWithTextarea(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function copyDailyReportSelection() {
  const selection = window.getSelection && window.getSelection();
  const range = document.createRange();

  if (!selection || !range.selectNodeContents) {
    return false;
  }

  selection.removeAllRanges();
  range.selectNodeContents(els.dailyReportContent);
  selection.addRange(range);
  const copied = document.execCommand("copy");
  selection.removeAllRanges();
  return copied;
}

function renderLoginTimeList(issues) {
  const filteredIssues = filterIssuesBySearch(issues);
  els.loginTimeInfo.textContent = `${filteredIssues.length} issue`;

  if (!filteredIssues.length) {
    els.loginTimeRows.innerHTML = '<tr><td colspan="8" class="empty-cell">No matching issues.</td></tr>';
    applyLogTimeLoggedUserFilter();
    return;
  }

  els.loginTimeRows.innerHTML = filteredIssues.map(loginTimeRow).join("");
  applyLogTimeLoggedUserFilter();
}

function applyLogTimeLoggedUserFilter() {
  const targetUserId = Number(els.loginLoggedUserId.value);
  const targetRows = els.loginTimeRows.querySelectorAll("[data-spent-user-ids]");

  for (let index = 0; index < targetRows.length; index += 1) {
    const spentUserIds = String(targetRows[index].dataset.spentUserIds || "")
      .split(",")
      .map(Number);
    targetRows[index].hidden = hideLoggedTimeTickets && spentUserIds.includes(targetUserId);
  }

  els.toggleLoggedTimeTickets.checked = hideLoggedTimeTickets;
}

function renderReport(lists, total) {
  const filteredLists = filterReportListsBySearch(lists || {});
  const filteredTotal =
    (filteredLists.prevCsharp || []).length +
    (filteredLists.prevWeb || []).length +
    (filteredLists.currentCsharp || []).length +
    (filteredLists.currentWeb || []).length;
  const previousRows = (lists && lists.hasPrevious)
    ? [
        reportSectionRow("■先週の作業"),
        reportTeamRow("C#開発"),
        reportIssueRows("prevCsharp", filteredLists.prevCsharp || []),
        reportTeamRow("WEB開発"),
        reportIssueRows("prevWeb", filteredLists.prevWeb || []),
        reportSpacerRow(),
      ]
    : [];

  els.reportInfo.textContent = `${filteredTotal} issue`;
  els.reportRows.innerHTML = previousRows.concat([
    reportSectionRow("◆今週の計画"),
    reportTeamRow("C#開発"),
    reportIssueRows("currentCsharp", filteredLists.currentCsharp || []),
    reportTeamRow("WEB開発"),
    reportIssueRows("currentWeb", filteredLists.currentWeb || []),
  ]).join("");
}

function handleReportSelectionChange(event) {
  const checkbox = event.target;
  if (!checkbox.classList || !checkbox.classList.contains("report-row-checkbox")) {
    return;
  }

  const row = checkbox.closest("tr");
  if (row) {
    row.classList.toggle("report-row-excluded", !checkbox.checked);
  }
}

function getSelectedReportLists() {
  const listNames = ["prevCsharp", "prevWeb", "currentCsharp", "currentWeb"];
  const selectedLists = Object.assign({}, loadedReportLists);

  listNames.forEach((listName) => {
    const selectedIds = new Set(
      Array.from(els.reportRows.querySelectorAll(`.report-row-checkbox[data-report-list="${listName}"]:checked`)).map(
        (checkbox) => Number(checkbox.dataset.issueId)
      )
    );
    selectedLists[listName] = (loadedReportLists[listName] || []).filter((issue) => selectedIds.has(Number(issue.id)));
  });

  return selectedLists;
}

function getIssueUrl(issue) {
  const baseUrl = normalizeBaseUrl(REDMINE.baseUrl);
  return baseUrl && issue && issue.id ? `${baseUrl}/issues/${issue.id}` : "#";
}

function issueRow(issue, index) {
  const issueUrl = getIssueUrl(issue);
  const done = Math.max(0, Math.min(100, Number(issue.done_ratio) || 0));
  const rowClass = getProcessingIssueHighlightClass(issue);

  return `
    <tr class="${rowClass}">
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${highlightSearchText(issue.id)}</a></td>
      <td>${highlightSearchText((issue.project && issue.project.name) || "-")}</td>
      <td>${highlightSearchText(issue.subject || "-")}</td>
      <td>${highlightSearchText((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${highlightSearchText((issue.status && issue.status.name) || "-")}</span></td>
      <td>${highlightSearchText(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${highlightSearchText(formatDate(issue.due_date))}</span></td>
      <td>
        ${done}%
        <div class="done-bar" aria-hidden="true"><span style="width: ${done}%"></span></div>
      </td>
    </tr>
  `;
}

function notStartedIssueRow(issue, index) {
  const issueUrl = getIssueUrl(issue);
  const done = Math.max(0, Math.min(100, Number(issue.done_ratio) || 0));
  const rowClass = getNotStartedIssueHighlightClass(issue);

  return `
    <tr class="${rowClass}">
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${highlightSearchText(issue.id)}</a></td>
      <td>${highlightSearchText((issue.project && issue.project.name) || "-")}</td>
      <td>${highlightSearchText((issue.tracker && issue.tracker.name) || "-")}</td>
      <td>${highlightSearchText(issue.subject || "-")}</td>
      <td>${highlightSearchText((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${highlightSearchText((issue.status && issue.status.name) || "-")}</span></td>
      <td>${highlightSearchText(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${highlightSearchText(formatDate(issue.due_date))}</span></td>
      <td>
        ${done}%
        <div class="done-bar" aria-hidden="true"><span style="width: ${done}%"></span></div>
      </td>
    </tr>
  `;
}

function getProcessingIssueHighlightClass(issue) {
  return isDueTodayOrPast(issue) ? "issue-row-danger" : "";
}

function getNotStartedIssueHighlightClass(issue) {
  if (isStartToday(issue) || isPastDevelopmentIssue(issue)) {
    return "issue-row-danger";
  }

  if (isStartDateBeyondDashboardThreshold(issue)) {
    return "issue-row-success";
  }

  return "";
}

function getTaskIssueHighlightClass(issue) {
  if (isStatus(issue, ISSUE_STATUS.processing.name)) {
    return getProcessingIssueHighlightClass(issue);
  }
  if (isStatus(issue, ISSUE_STATUS.notStarted.name)) {
    return getNotStartedIssueHighlightClass(issue);
  }
  return "";
}

function isDueTodayOrPast(issue) {
  if (!issue.due_date) {
    return false;
  }
  return startOfDay(issue.due_date).getTime() <= startOfDay(new Date()).getTime();
}

function isStartToday(issue) {
  return isSameDate(issue.start_date, new Date());
}

function isPastDevelopmentIssue(issue) {
  if (getTrackerName(issue) !== "開発" || !issue.start_date) {
    return false;
  }
  return startOfDay(issue.start_date).getTime() < startOfDay(new Date()).getTime();
}

function isStartDateBeyondDashboardThreshold(issue) {
  if (!issue.start_date) {
    return false;
  }

  const today = startOfDay(new Date());
  const startDate = startOfDay(issue.start_date);
  const diffDays = Math.floor((startDate.getTime() - today.getTime()) / 86400000);
  const thresholdDays = today.getDay() === 5 ? 3 : 1;
  return diffDays === thresholdDays;
}

function isSameDate(value, target) {
  if (!value || !target) {
    return false;
  }
  return startOfDay(value).getTime() === startOfDay(target).getTime();
}

function processedIssueRow(issue, index) {
  const issueUrl = getIssueUrl(issue);
  const done = Math.max(0, Math.min(100, Number(issue.done_ratio) || 0));

  return `
    <tr>
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${highlightSearchText(issue.id)}</a></td>
      <td>${highlightSearchText((issue.project && issue.project.name) || "-")}</td>
      <td>${highlightSearchText(issue.subject || "-")}</td>
      <td>${highlightSearchText((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${highlightSearchText((issue.status && issue.status.name) || "-")}</span></td>
      <td>${highlightSearchText(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${highlightSearchText(formatDate(issue.due_date))}</span></td>
      <td>
        ${done}%
        <div class="done-bar" aria-hidden="true"><span style="width: ${done}%"></span></div>
      </td>
      <td>${escapeHtml(getCustomFieldDisplayValue(issue, RELEASE_TARGET_FIELD_NAME) || "-")}</td>
    </tr>
  `;
}

function reportSectionRow(title) {
  return `<tr class="report-section-row"><td colspan="8">${escapeHtml(title)}</td></tr>`;
}

function reportTeamRow(title) {
  return `<tr class="report-team-row"><td colspan="8">${escapeHtml(title)}</td></tr>`;
}

function reportSpacerRow() {
  return '<tr class="report-spacer-row"><td colspan="8"></td></tr>';
}

function reportIssueRows(listName, issues) {
  const exportIssues = issues.length ? issues : [null];
  return exportIssues.map((issue, index) => reportIssueRow(issue, index, listName)).join("");
}

function reportIssueRow(issue, index, listName) {
  if (!issue) {
    return `
      <tr>
        <td>${index + 1}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `;
  }

  const issueUrl = getIssueUrl(issue);

  return `
    <tr data-report-list="${escapeAttr(listName)}" data-issue-id="${escapeAttr(issue.id)}">
      <td>
        <label class="report-selection-control">
          <input class="report-row-checkbox" type="checkbox" data-report-list="${escapeAttr(listName)}" data-issue-id="${escapeAttr(
    issue.id
  )}" checked />
          <span>${index + 1}</span>
        </label>
      </td>
      <td>${highlightSearchText((issue.project && issue.project.name) || "")}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${highlightSearchText(issue.id)}</a></td>
      <td>${highlightSearchText(issue.subject || "")}</td>
      <td>${highlightSearchText((issue.assigned_to && issue.assigned_to.name) || "")}</td>
      <td><span class="tag">${highlightSearchText((issue.status && issue.status.name) || "-")}</span></td>
      <td>${highlightSearchText(formatExcelDate(issue.start_date))}</td>
      <td>${highlightSearchText(formatExcelDate(issue.due_date))}</td>
    </tr>
  `;
}

function myTaskRow(issue, index) {
  const issueUrl = getIssueUrl(issue);
  const rowClass = getTaskIssueHighlightClass(issue);

  return `
    <tr class="${rowClass}">
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${highlightSearchText(issue.id)}</a></td>
      <td>${highlightSearchText((issue.project && issue.project.name) || "-")}</td>
      <td>${highlightSearchText(issue.subject || "-")}</td>
      <td><span class="tag">${highlightSearchText((issue.status && issue.status.name) || "-")}</span></td>
      <td>${highlightSearchText(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${highlightSearchText(formatDate(issue.due_date))}</span></td>
    </tr>
  `;
}

function loginTimeRow(issue, index) {
  const issueUrl = getIssueUrl(issue);
  const spentUserIds = (issue.spentUserIds || []).join(",");

  return `
    <tr data-spent-user-ids="${escapeAttr(spentUserIds)}">
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${highlightSearchText(issue.id)}</a></td>
      <td>${highlightSearchText(formatHours(issue.loginSpentHours))}</td>
      <td>${highlightSearchText(issue.subject || "-")}</td>
      <td>${highlightSearchText((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${highlightSearchText((issue.status && issue.status.name) || "-")}</span></td>
      <td>${highlightSearchText(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${highlightSearchText(formatDate(issue.due_date))}</span></td>
    </tr>
    ${timeEntryDetails(issue.loginSpentEntries || [], spentUserIds)}
  `;
}

function timeEntryDetails(entries, spentUserIds) {
  if (!entries.length) {
    return "";
  }

  return entries.map((entry) => timeEntryDetail(entry, spentUserIds)).join("");
}

function timeEntryDetail(entry, spentUserIds) {
  return `
    <tr class="time-entry-detail-row" data-spent-user-ids="${escapeAttr(spentUserIds)}">
      <td></td>
      <td></td>
      <td>${escapeHtml(formatHours(entry.hours))}</td>
      <td>${escapeHtml(entry.comments || "-")}</td>
      <td>${escapeHtml((entry.user && entry.user.name) || "-")}</td>
      <td></td>
      <td>${escapeHtml(formatDate(entry.spent_on))}</td>
      <td></td>
    </tr>
  `;
}

function renderError(message) {
  const safeMessage = escapeHtml(message);
  els.processingCount.textContent = "0";
  els.notStartedCount.textContent = "0";
  els.processedCount.textContent = "0";
  els.processingInfo.textContent = "0 issue";
  els.notStartedInfo.textContent = "0 issue";
  els.processedInfo.textContent = "0 issue";
  els.processingRows.innerHTML = `<tr><td colspan="9" class="empty-cell">${safeMessage}</td></tr>`;
  els.notStartedRows.innerHTML = `<tr><td colspan="10" class="empty-cell">${safeMessage}</td></tr>`;
  els.processedRows.innerHTML = `<tr><td colspan="10" class="empty-cell">${safeMessage}</td></tr>`;
}

function renderDashboardListError(name, message) {
  const safeMessage = escapeHtml(message);
  dashboardLists[name] = [];
  els[`${name}Count`].textContent = "0";
  els[`${name}Info`].textContent = "0 issue";
  els[`${name}Rows`].innerHTML = `<tr><td colspan="${getDashboardListColspan(name)}" class="empty-cell">${safeMessage}</td></tr>`;
}

function renderMyTaskError(message) {
  els.myTaskRows.innerHTML = `<tr><td colspan="7" class="empty-cell">${escapeHtml(message)}</td></tr>`;
}

function renderDailyReportError(message) {
  els.dailyReportInfo.textContent = "0 issue";
  els.dailyReportContent.textContent = message;
  els.copyDailyReport.disabled = true;
}

function renderLoginTimeError(message) {
  els.loginTimeRows.innerHTML = `<tr><td colspan="8" class="empty-cell">${escapeHtml(message)}</td></tr>`;
}

function renderReportError(message) {
  const safeMessage = escapeHtml(message);
  els.reportInfo.textContent = "0 issue";
  els.reportRows.innerHTML = `<tr><td colspan="8" class="empty-cell">${safeMessage}</td></tr>`;
}

function isOverdue(issue) {
  if (!issue.due_date || issue.closed_on) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return startOfDay(issue.due_date) < today;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatExcelDate(value) {
  if (!value) {
    return "";
  }
  const date = parseDateValue(value);
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
}

function formatReportDate(value) {
  if (!value) {
    return "-";
  }
  const date = parseDateValue(value);
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
}

function formatMonthDayRange(startDate, endDate) {
  return `${pad2(startDate.getMonth() + 1)}.${pad2(startDate.getDate())}~${pad2(endDate.getMonth() + 1)}.${pad2(
    endDate.getDate()
  )}`;
}

function formatJapaneseDateRange(startDate, endDate) {
  return `${startDate.getFullYear()}年${pad2(startDate.getMonth() + 1)}月${pad2(startDate.getDate())}日〜${endDate.getFullYear()}年${pad2(
    endDate.getMonth() + 1
  )}月${pad2(endDate.getDate())}日`;
}

function formatTimestamp(value) {
  return `${value.getFullYear()}${pad2(value.getMonth() + 1)}${pad2(value.getDate())}_${pad2(value.getHours())}${pad2(
    value.getMinutes()
  )}`;
}

function parseDateValue(value) {
  if (typeof value === "string") {
    const parts = value.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  return new Date(value);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatApiDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatInputDate(value) {
  return formatApiDate(value);
}

function formatHours(value) {
  const hours = Number(value) || 0;
  return `${hours.toFixed(2).replace(/\.?0+$/, "")} h`;
}

function setStatus(message, type = "") {
  console.log(`[${type || "info"}] ${message}`);
}

function normalizeBaseUrl(value) {
  return String(value).trim().replace(/\/+$/, "");
}

function getApiBaseUrl() {
  return REDMINE.proxyUrl || REDMINE.baseUrl || "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

init();
