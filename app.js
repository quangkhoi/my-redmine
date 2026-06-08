const DEFAULT_CONFIG = {
  baseUrl: "https://redmine.wdm.co.jp/",
  proxyUrl: "",
  apiKey: "",
  basicAuth: {
    username: "",
    password: "",
  },
  statuses: {
    processing: "処理中",
    notStarted: "未対応",
    processed: "処理済み",
  },
  statusIds: {
    processing: 2,
    notStarted: 1,
    processed: 3,
  },
  allowedLogins: ["duydinh", "khoiduong@freec.asia", "namtran", "tuyennguyen", "phihoang1994", "260618"],
  allowedAssigneeIds: [106, 114, 94, 113, 99, 123],
};
const CONFIG_STORAGE_KEY = "redmine-dashboard-config";
let config = buildRuntimeConfig();

const STATUS_NAMES = {
  processing: (config.statuses && config.statuses.processing) || "処理中",
  notStarted: (config.statuses && config.statuses.notStarted) || "未対応",
  processed: (config.statuses && config.statuses.processed) || "処理済み",
};

const WORK_ITEM_STATUS_NAMES = new Set([
  STATUS_NAMES.notStarted,
  STATUS_NAMES.processing,
  STATUS_NAMES.processed,
  "完了",
]);

const MY_TASK_EXCLUDED_STATUS_NAMES = new Set(["完了（中止）", "完了（保留）", "完了"]);
const RELEASE_TARGET_FIELD_NAME = "リリース対象";
const RELEASE_TARGET_VALUE_NAMES = new Map([
  ["36", "ESP"],
  ["40", "WEB"],
  ["41", ".env"],
  ["37", "バッチ"],
  ["39", "DB"],
]);
const DAILY_REPORT_ASSIGNEES = [
  { id: 94, name: "Nam" },
  { id: 99, name: "Tuyen" },
  { id: 106, name: "Duy" },
  { id: 123, name: "Phi" },
];
const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮"];

const els = {
  appLayout: document.querySelector(".app-layout"),
  collapseSidebar: document.querySelector("#collapseSidebar"),
  expandSidebar: document.querySelector("#expandSidebar"),
  loadDashboard: document.querySelector("#loadDashboard"),
  loadDailyReport: document.querySelector("#loadDailyReport"),
  copyDailyReport: document.querySelector("#copyDailyReport"),
  loadMyTask: document.querySelector("#loadMyTask"),
  loadReport: document.querySelector("#loadReport"),
  exportReport: document.querySelector("#exportReport"),
  loadLoginTime: document.querySelector("#loadLoginTime"),
  configPanel: document.querySelector("#configPanel"),
  configForm: document.querySelector("#configForm"),
  configBaseUrl: document.querySelector("#configBaseUrl"),
  configProxyUrl: document.querySelector("#configProxyUrl"),
  configApiKey: document.querySelector("#configApiKey"),
  configBasicUsername: document.querySelector("#configBasicUsername"),
  configBasicPassword: document.querySelector("#configBasicPassword"),
  clearConfig: document.querySelector("#clearConfig"),
  myTaskUserId: document.querySelector("#myTaskUserId"),
  myTaskStartDate: document.querySelector("#myTaskStartDate"),
  myTaskEndDate: document.querySelector("#myTaskEndDate"),
  myTaskStartCondition: document.querySelector("#myTaskStartCondition"),
  myTaskEndCondition: document.querySelector("#myTaskEndCondition"),
  myTaskInfo: document.querySelector("#myTaskInfo"),
  myTaskRows: document.querySelector("#myTaskRows"),
  reportStartDate: document.querySelector("#reportStartDate"),
  reportRangeLabel: document.querySelector("#reportRangeLabel"),
  reportInfo: document.querySelector("#reportInfo"),
  reportRows: document.querySelector("#reportRows"),
  loginYear: document.querySelector("#loginYear"),
  loginMonth: document.querySelector("#loginMonth"),
  loginStartCondition: document.querySelector("#loginStartCondition"),
  loginDueCondition: document.querySelector("#loginDueCondition"),
  loginTimeInfo: document.querySelector("#loginTimeInfo"),
  toggleLoginTimeUser114: document.querySelector("#toggleLoginTimeUser114"),
  loginTimeRows: document.querySelector("#loginTimeRows"),
  processingStartCondition: document.querySelector("#processingStartCondition"),
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
  dailyReportInfo: document.querySelector("#dailyReportInfo"),
  dailyReportContent: document.querySelector("#dailyReportContent"),
  navGroups: document.querySelectorAll(".nav-group"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
};

let allowedAssigneeIds = new Set((config.allowedAssigneeIds || []).map(Number).filter(Boolean));
let hideLoginTimeUser114 = false;
let globalLoadingCount = 0;
let loadedReportLists = null;
let releaseTargetValueNames = new Map();

function init() {
  renderConfigForm();
  renderConfigPanel();
  renderMyTaskControls();
  renderReportControls();
  renderLoginTimeControls();
  renderListConditions();
  renderMyTaskConditions();
  renderReportConditions();
  renderLoginTimeConditions();
  renderInitialEmptyLists();
  bindEvents();
}

function bindEvents() {
  els.collapseSidebar.addEventListener("click", collapseSidebar);
  els.expandSidebar.addEventListener("click", expandSidebar);
  els.loadDashboard.addEventListener("click", loadDashboard);
  els.loadDailyReport.addEventListener("click", loadDailyReport);
  els.copyDailyReport.addEventListener("click", copyDailyReport);
  els.loadMyTask.addEventListener("click", loadMyTask);
  els.loadReport.addEventListener("click", loadReport);
  els.exportReport.addEventListener("click", exportReport);
  els.loadLoginTime.addEventListener("click", loadLoginTime);
  els.configForm.addEventListener("submit", saveRuntimeConfig);
  els.clearConfig.addEventListener("click", clearRuntimeConfig);
  els.toggleLoginTimeUser114.addEventListener("click", toggleLoginTimeUser114Rows);
  els.myTaskStartDate.addEventListener("change", renderMyTaskConditions);
  els.myTaskEndDate.addEventListener("change", renderMyTaskConditions);
  els.reportStartDate.addEventListener("change", renderReportConditions);
  els.loginYear.addEventListener("change", renderLoginTimeConditions);
  els.loginMonth.addEventListener("change", renderLoginTimeConditions);
  els.navItems.forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.view));
  });
}

function buildRuntimeConfig() {
  return mergeConfig(DEFAULT_CONFIG, window.REDMINE_CONFIG || {}, readStoredConfig());
}

function mergeConfig(...sources) {
  return sources.reduce((merged, source) => {
    const next = source || {};
    return Object.assign({}, merged, next, {
      basicAuth: Object.assign({}, merged.basicAuth || {}, next.basicAuth || {}),
      statuses: Object.assign({}, merged.statuses || {}, next.statuses || {}),
      statusIds: Object.assign({}, merged.statusIds || {}, next.statusIds || {}),
    });
  }, {});
}

function readStoredConfig() {
  try {
    return JSON.parse(sessionStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function renderConfigForm() {
  els.configBaseUrl.value = config.baseUrl || "";
  els.configProxyUrl.value = config.proxyUrl || "";
  els.configApiKey.value = config.apiKey || "";
  els.configBasicUsername.value = (config.basicAuth && config.basicAuth.username) || "";
  els.configBasicPassword.value = (config.basicAuth && config.basicAuth.password) || "";
}

function renderConfigPanel() {
  const isReady = hasRuntimeConfig();
  els.configPanel.classList.toggle("is-configured", isReady);
  els.configPanel.querySelector(".config-state").textContent = getConfigStateMessage(isReady);
}

function getConfigStateMessage(isReady) {
  if (isConfiguredProxyBlocked()) {
    return "GitHub Pages cannot call an HTTP local proxy. Use direct Redmine HTTPS or an HTTPS proxy.";
  }
  return isReady
    ? "Configured for this browser session."
    : "Enter a Redmine URL/API key or an HTTPS proxy before loading data.";
}

function saveRuntimeConfig(event) {
  event.preventDefault();

  const nextConfig = {
    baseUrl: els.configBaseUrl.value.trim(),
    proxyUrl: els.configProxyUrl.value.trim(),
    apiKey: els.configApiKey.value.trim(),
    basicAuth: {
      username: els.configBasicUsername.value.trim(),
      password: els.configBasicPassword.value,
    },
  };

  sessionStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(nextConfig));
  config = buildRuntimeConfig();
  allowedAssigneeIds = new Set((config.allowedAssigneeIds || []).map(Number).filter(Boolean));
  renderConfigPanel();
  setStatus("Saved Redmine configuration for this browser session.", "ok");
}

function clearRuntimeConfig() {
  sessionStorage.removeItem(CONFIG_STORAGE_KEY);
  config = buildRuntimeConfig();
  renderConfigForm();
  renderConfigPanel();
  setStatus("Cleared browser session configuration.", "ok");
}

function hasRuntimeConfig() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    return false;
  }
  if (isConfiguredProxyBlocked()) {
    return false;
  }
  if (normalizeBaseUrl(config.proxyUrl || "")) {
    return true;
  }
  return Boolean((config.apiKey || "").trim() || buildBasicAuthHeader());
}

function requireRuntimeConfig() {
  if (!hasRuntimeConfig()) {
    renderConfigPanel();
    throw new Error("Enter Redmine configuration before loading data.");
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

function toggleLoginTimeUser114Rows() {
  hideLoginTimeUser114 = !hideLoginTimeUser114;
  applyLoginTimeUser114Filter();
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
      : viewName === "config"
      ? "configView"
      : `${viewName}View`;
  const target = document.querySelector(`#${targetId}`);
  if (target) {
    target.classList.add("active");
  }
}

function renderListConditions() {
  const range = getDashboardDateRange();
  els.processingStartCondition.textContent = formatDate(range.lastMonday);
  els.notStartedStartCondition.textContent = formatDate(range.lastMonday);
  els.notStartedDueCondition.textContent = formatDate(range.nextFriday);
}

function renderMyTaskControls() {
  const range = getMyTaskDefaultRange();
  els.myTaskStartDate.value = formatInputDate(range.startDate);
  els.myTaskEndDate.value = formatInputDate(range.endDate);
}

function renderMyTaskConditions() {
  const range = getSelectedMyTaskRange();
  els.myTaskStartCondition.textContent = formatDate(range.startDate);
  els.myTaskEndCondition.textContent = formatDate(range.endDate);
}

function renderReportControls() {
  const ranges = getReportDateRanges();
  const maxDate = new Date(ranges.current.monday);
  maxDate.setDate(ranges.current.monday.getDate() - 1);
  els.reportStartDate.value = formatInputDate(ranges.previous.monday);
  els.reportStartDate.max = formatInputDate(maxDate);
}

function renderLoginTimeControls() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const years = [];

  for (let year = currentYear - 3; year <= currentYear + 1; year += 1) {
    years.push(year);
  }

  els.loginYear.innerHTML = years
    .map((year) => `<option value="${year}" ${year === currentYear ? "selected" : ""}>${year}</option>`)
    .join("");
  els.loginMonth.innerHTML = Array.from({ length: 12 }, (_, index) => index + 1)
    .map((month) => `<option value="${month}" ${month === currentMonth ? "selected" : ""}>${month}</option>`)
    .join("");
}

function renderLoginTimeConditions() {
  const range = getSelectedLoginMonthRange();
  els.loginStartCondition.textContent = formatDate(range.monthEnd);
  els.loginDueCondition.textContent = formatDate(range.monthStart);
}

function renderReportConditions() {
  const ranges = getReportDateRanges();
  const reportStartDate = getSelectedReportStartDate();
  els.reportRangeLabel.textContent = `Report time: ${formatDate(reportStartDate)} ~ ${formatDate(ranges.current.friday)}`;
}

function renderInitialEmptyLists() {
  renderList("processing", []);
  renderList("notStarted", []);
  renderList("processed", []);
  renderDailyReport([]);
  renderMyTaskList([]);
  renderReport({ prevCsharp: [], prevWeb: [], currentCsharp: [], currentWeb: [] }, 0);
  renderLoginTimeList([]);
}

function renderDashboardLoading() {
  els.processingRows.innerHTML = '<tr><td colspan="9" class="empty-cell">Loading data...</td></tr>';
  els.notStartedRows.innerHTML = '<tr><td colspan="10" class="empty-cell">Loading data...</td></tr>';
  els.processedRows.innerHTML = '<tr><td colspan="10" class="empty-cell">Loading data...</td></tr>';
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
    allowedAssigneeIds = new Set((config.allowedAssigneeIds || []).map(Number).filter(Boolean));
    if (!allowedAssigneeIds.size) {
      throw new Error("Please configure allowedAssigneeIds in config.js.");
    }
    const lists = await fetchDashboardLists();

    renderList("processing", lists.processing);
    renderList("notStarted", lists.notStarted);
    renderList("processed", lists.processed);
    const total = lists.processing.length + lists.notStarted.length + lists.processed.length;
    setStatus(`Loaded ${total} issues from Redmine.`, "ok");
  } catch (error) {
    renderError(error.message);
    setStatus("Could not load data", "error");
  } finally {
    els.loadDashboard.disabled = false;
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
    const issues = await fetchMyTaskIssues();
    renderMyTaskList(issues);
    setStatus(`Loaded ${issues.length} my task issues from Redmine.`, "ok");
  } catch (error) {
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
    const issues = await fetchDailyReportIssues();
    renderDailyReport(issues, true);
    setStatus(`Loaded ${issues.length} daily report issues from Redmine.`, "ok");
  } catch (error) {
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
      lists.prevCsharp.length + lists.prevWeb.length + lists.currentCsharp.length + lists.currentWeb.length;
    renderReport(lists, total);
    els.exportReport.disabled = false;
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

  const ranges = getReportDateRanges();
  const rangeLabel = formatMonthDayRange(ranges.previous.monday, ranges.previous.friday);
  const sheetName = `Report (${rangeLabel})`;
  const reportTitle = `週報（${formatJapaneseDateRange(ranges.previous.monday, ranges.previous.friday)}）`;
  const sheet = buildReportSheet(loadedReportLists, reportTitle);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  window.XLSX.writeFile(workbook, `redmine-report_${formatTimestamp(new Date())}.xlsx`);
  setStatus("Exported report Excel file.", "ok");
}

async function loadLoginTime() {
  switchView("login-time");
  setStatus("Loading login time data...");
  beginGlobalLoading();
  els.loadLoginTime.disabled = true;
  renderLoginTimeLoading();

  try {
    requireRuntimeConfig();
    allowedAssigneeIds = new Set((config.allowedAssigneeIds || []).map(Number).filter(Boolean));
    if (!allowedAssigneeIds.size) {
      throw new Error("Please configure allowedAssigneeIds in config.js.");
    }

    renderLoginTimeConditions();
    const issues = await fetchLoginTimeIssues();
    renderLoginTimeList(issues);
    setStatus(`Loaded ${issues.length} login time issues from Redmine.`, "ok");
  } catch (error) {
    renderLoginTimeError(error.message);
    setStatus("Could not load login time data", "error");
  } finally {
    els.loadLoginTime.disabled = false;
    endGlobalLoading();
  }
}

async function fetchReportLists() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Please configure the API URL in config.js.");
  }

  const ranges = getReportDateRanges();
  const reportStartDate = getSelectedReportStartDate();
  validateReportStartDate(reportStartDate, ranges.current.monday);
  const csharpAssigneeIds = [106, 94, 99];
  const webAssigneeIds = [123];

  const [prevCsharp, prevWeb, currentCsharp, currentWeb] = await Promise.all([
    fetchReportList({ assigneeIds: csharpAssigneeIds, range: ranges.previous, dueDateFrom: reportStartDate }),
    fetchReportList({ assigneeIds: webAssigneeIds, range: ranges.previous, dueDateFrom: reportStartDate }),
    fetchReportList({ assigneeIds: csharpAssigneeIds, range: ranges.current }),
    fetchReportList({ assigneeIds: webAssigneeIds, range: ranges.current }),
  ]);

  return { prevCsharp, prevWeb, currentCsharp, currentWeb };
}

async function fetchReportList({ assigneeIds, range, dueDateFrom }) {
  const issues = await fetchIssuesForAssigneeIds(assigneeIds, {
    statusId: "*",
    startDateTo: range.friday,
    dueDateFrom: dueDateFrom || range.monday,
  });
  const sortedIssues = sortIssues(issues.filter(isWorkItemStatusIssue));
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
      values.forEach((value, colIndex) => setCell(row, colIndex + 1, value, 5));
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
  let nextRow = addTaskBlock(3, "■先週の作業", lists.prevCsharp || [], lists.prevWeb || []);
  nextRow += 3;
  addTaskBlock(nextRow, "◆今週の計画", lists.currentCsharp || [], lists.currentWeb || []);

  const sheet = window.XLSX.utils.aoa_to_sheet(rows);
  Object.keys(styles).forEach((address) => {
    if (!sheet[address]) {
      sheet[address] = { t: "s", v: "" };
    }
    sheet[address].s = styles[address];
  });
  sheet["!merges"] = merges;
  sheet["!cols"] = [
    { wch: 4.5 },
    { wch: 4.5 },
    { wch: 18 },
    { wch: 10 },
    { wch: 40 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];
  sheet["!rows"] = [];
  sheet["!rows"][1] = { hpt: 18 };
  return sheet;
}

async function fetchDashboardLists() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Please configure the API URL in config.js.");
  }

  const statusIds = await fetchStatusIds();
  const range = getDashboardDateRange();
  releaseTargetValueNames = await fetchCustomFieldValueNameMap(RELEASE_TARGET_FIELD_NAME).catch(() => new Map());

  const [processing, notStarted, processed] = await Promise.all([
    fetchIssuesForAssignees({
      statusId: statusIds.processing,
      startDateFrom: range.lastMonday,
    }),
    fetchIssuesForAssignees({
      statusId: statusIds.notStarted,
      startDateFrom: range.lastMonday,
      dueDateTo: range.nextFriday,
    }),
    fetchIssuesForAssignees({
      statusId: statusIds.processed,
    }),
  ]);

  return {
    processing: sortIssues(processing),
    notStarted: sortNotStartedIssues(notStarted),
    processed: sortIssuesDescending(processed.filter((issue) => Number(issue.done_ratio) !== 100)),
  };
}

async function fetchDailyReportIssues() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Please configure the API URL in config.js.");
  }

  const today = startOfDay(new Date());
  const statusIds = await fetchStatusIds();
  const assigneeIds = DAILY_REPORT_ASSIGNEES.map((item) => item.id);
  const [todayIssues, processingIssues] = await Promise.all([
    fetchIssuesForAssigneeIds(assigneeIds, {
      statusId: "*",
      startDateFrom: today,
      startDateTo: today,
    }),
    fetchIssuesForAssigneeIds(assigneeIds, {
      statusId: statusIds.processing,
    }),
  ]);

  const filteredTodayIssues = todayIssues.filter((issue) => Number(issue.assigned_to && issue.assigned_to.id) !== 114);
  const filteredProcessingIssues = processingIssues.filter((issue) => Number(issue.done_ratio) < 90);

  return sortIssues(uniqueIssues(filteredTodayIssues.concat(filteredProcessingIssues)));
}

async function fetchMyTaskIssues() {
  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    throw new Error("Please configure the API URL in config.js.");
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
    throw new Error("Please configure the API URL in config.js.");
  }

  const range = getSelectedLoginMonthRange();
  const issues = await fetchIssuesForAssignees({
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
      hasUser114SpentTime: hasSpentTimeByUser(spentDetailsByIssueId.get(Number(issue.id)) || {}, 114),
    })
  );
}

async function fetchStatusIds() {
  if (config.statusIds && config.statusIds.processing && config.statusIds.notStarted && config.statusIds.processed) {
    return {
      processing: config.statusIds.processing,
      notStarted: config.statusIds.notStarted,
      processed: config.statusIds.processed,
    };
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
    processing: findId(STATUS_NAMES.processing),
    notStarted: findId(STATUS_NAMES.notStarted),
    processed: findId(STATUS_NAMES.processed),
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
  return fetchIssuesForAssigneeIds(Array.from(allowedAssigneeIds), filters);
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
  const headers = {};
  const usesProxy = isProxyRequest(url);
  const apiKey = (config.apiKey || "").trim();

  if (!usesProxy) {
    if (apiKey) {
      headers["X-Redmine-API-Key"] = apiKey;
    }
    const basicAuthHeader = buildBasicAuthHeader();
    if (basicAuthHeader) {
      headers.Authorization = basicAuthHeader;
    }
  }

  const headerResponse = await safeFetch(url, {
    headers,
  });

  if (headerResponse.ok) {
    return headerResponse.json();
  }

  if (apiKey && headerResponse.status === 401) {
    const queryUrl = new URL(url.toString());
    queryUrl.searchParams.set("key", apiKey);
    const queryResponse = await safeFetch(queryUrl, {
      credentials: "include",
    });

    if (queryResponse.ok) {
      return queryResponse.json();
    }

    throw buildHttpError(queryResponse, queryUrl);
  }

  throw buildHttpError(headerResponse, url);
}

async function safeFetch(url, options) {
  if (isBlockedHttpProxyFromHttpsPage(url)) {
    throw new Error(
      "GitHub Pages runs on HTTPS and cannot call an HTTP local proxy such as http://127.0.0.1:8787. Use direct Redmine HTTPS if CORS allows it, or configure an HTTPS proxy endpoint."
    );
  }

  try {
    return await fetch(url, options);
  } catch (error) {
    throw new Error(
      `Could not call the API at ${url.pathname}. Run start-proxy.bat in this app folder, then load the data again.`
    );
  }
}

function buildHttpError(response, url) {
  if (response.status === 404 && isProxyRequest(url) && url.pathname === "/time_entries.json") {
    return new Error(
      "The running proxy is an old version and does not expose /time_entries.json. Run start-proxy.bat again, then reload Login time."
    );
  }

  if (response.status === 401) {
    return new Error(
      `The API returned HTTP 401 at ${url.pathname}. The server requires login/Basic Auth, or the API key is invalid.`
    );
  }

  if (response.status === 0) {
    return new Error("The browser blocked the request. Redmine may not have CORS enabled for this page.");
  }

  return new Error(`The API returned HTTP ${response.status} at ${url.pathname}.`);
}

function buildBasicAuthHeader() {
  const username = (config.basicAuth && config.basicAuth.username) || "";
  const password = (config.basicAuth && config.basicAuth.password) || "";
  if (!username && !password) {
    return "";
  }
  return `Basic ${btoa(`${username}:${password}`)}`;
}

function isProxyRequest(url) {
  const proxyUrl = normalizeBaseUrl(config.proxyUrl || "");
  return proxyUrl && url.toString().startsWith(proxyUrl);
}

function isBlockedHttpProxyFromHttpsPage(url) {
  if (window.location.protocol !== "https:" || url.protocol !== "http:") {
    return false;
  }

  const host = url.hostname.toLowerCase();
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function isConfiguredProxyBlocked() {
  const proxyUrl = normalizeBaseUrl(config.proxyUrl || "");
  if (!proxyUrl) {
    return false;
  }

  try {
    return isBlockedHttpProxyFromHttpsPage(new URL(proxyUrl));
  } catch (error) {
    return false;
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

function hasSpentTimeByUser(details, userId) {
  const entries = details.entries || [];
  return entries.some((entry) => Number(entry.user && entry.user.id) === userId);
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
  return { monthStart, monthEnd };
}

function getSelectedMyTaskRange() {
  return {
    startDate: parseInputDate(els.myTaskStartDate.value),
    endDate: parseInputDate(els.myTaskEndDate.value),
  };
}

function getSelectedReportStartDate() {
  return parseInputDate(els.reportStartDate.value);
}

function validateReportStartDate(startDate, currentMonday) {
  if (!startDate) {
    throw new Error("Please select report start date.");
  }
  if (startDate.getTime() >= currentMonday.getTime()) {
    throw new Error("Report start date must be before Monday of the current week.");
  }
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

function renderList(name, issues) {
  const rowsEl = els[`${name}Rows`];
  const countEl = els[`${name}Count`];
  const infoEl = els[`${name}Info`];

  countEl.textContent = issues.length;
  infoEl.textContent = `${issues.length} issue`;

  if (!issues.length) {
    const colspan = name === "processing" ? 9 : 10;
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
  els.myTaskInfo.textContent = `${issues.length} issue`;

  if (!issues.length) {
    els.myTaskRows.innerHTML = '<tr><td colspan="7" class="empty-cell">No matching issues.</td></tr>';
    return;
  }

  els.myTaskRows.innerHTML = issues.map(myTaskRow).join("");
}

function renderDailyReport(issues, isLoaded = false) {
  const groupedIssues = groupDailyReportIssues(issues);
  els.dailyReportInfo.textContent = `${issues.length} issue`;
  els.dailyReportContent.innerHTML = buildDailyReportHtml(groupedIssues);
  els.copyDailyReport.disabled = !isLoaded;
}

function groupDailyReportIssues(issues) {
  const groups = new Map(DAILY_REPORT_ASSIGNEES.map((assignee) => [assignee.id, []]));

  issues.forEach((issue) => {
    const assigneeId = Number(issue.assigned_to && issue.assigned_to.id);
    if (groups.has(assigneeId)) {
      groups.get(assigneeId).push(issue);
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
  els.loginTimeInfo.textContent = `${issues.length} issue`;

  if (!issues.length) {
    els.loginTimeRows.innerHTML = '<tr><td colspan="8" class="empty-cell">No matching issues.</td></tr>';
    applyLoginTimeUser114Filter();
    return;
  }

  els.loginTimeRows.innerHTML = issues.map(loginTimeRow).join("");
  applyLoginTimeUser114Filter();
}

function applyLoginTimeUser114Filter() {
  const targetRows = els.loginTimeRows.querySelectorAll('[data-has-user114-spent="true"]');

  for (let index = 0; index < targetRows.length; index += 1) {
    targetRows[index].hidden = hideLoginTimeUser114;
  }

  els.toggleLoginTimeUser114.textContent = hideLoginTimeUser114 ? "Show time" : "Hide time";
  els.toggleLoginTimeUser114.setAttribute("aria-pressed", String(hideLoginTimeUser114));
}

function renderReport(lists, total) {
  els.reportInfo.textContent = `${total} issue`;
  els.reportRows.innerHTML = [
    reportSectionRow("■先週の作業"),
    reportTeamRow("C#開発"),
    reportIssueRows(lists.prevCsharp || []),
    reportTeamRow("WEB開発"),
    reportIssueRows(lists.prevWeb || []),
    reportSpacerRow(),
    reportSectionRow("◆今週の計画"),
    reportTeamRow("C#開発"),
    reportIssueRows(lists.currentCsharp || []),
    reportTeamRow("WEB開発"),
    reportIssueRows(lists.currentWeb || []),
  ].join("");
}

function getIssueUrl(issue) {
  const baseUrl = normalizeBaseUrl(config.baseUrl || "");
  return baseUrl && issue && issue.id ? `${baseUrl}/issues/${issue.id}` : "#";
}

function issueRow(issue, index) {
  const issueUrl = getIssueUrl(issue);
  const done = Math.max(0, Math.min(100, Number(issue.done_ratio) || 0));
  const rowClass = getDashboardIssueHighlightClass(issue, { checkFutureStart: false });

  return `
    <tr class="${rowClass}">
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${escapeHtml(issue.id)}</a></td>
      <td>${escapeHtml((issue.project && issue.project.name) || "-")}</td>
      <td>${escapeHtml(issue.subject || "-")}</td>
      <td>${escapeHtml((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${escapeHtml((issue.status && issue.status.name) || "-")}</span></td>
      <td>${escapeHtml(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${escapeHtml(formatDate(issue.due_date))}</span></td>
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
  const rowClass = getDashboardIssueHighlightClass(issue, { checkFutureStart: true });

  return `
    <tr class="${rowClass}">
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${escapeHtml(issue.id)}</a></td>
      <td>${escapeHtml((issue.project && issue.project.name) || "-")}</td>
      <td>${escapeHtml((issue.tracker && issue.tracker.name) || "-")}</td>
      <td>${escapeHtml(issue.subject || "-")}</td>
      <td>${escapeHtml((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${escapeHtml((issue.status && issue.status.name) || "-")}</span></td>
      <td>${escapeHtml(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${escapeHtml(formatDate(issue.due_date))}</span></td>
      <td>
        ${done}%
        <div class="done-bar" aria-hidden="true"><span style="width: ${done}%"></span></div>
      </td>
    </tr>
  `;
}

function getDashboardIssueHighlightClass(issue, options) {
  const checkFutureStart = options && options.checkFutureStart;

  if (isDueToday(issue) || (checkFutureStart && isFutureDevelopmentIssue(issue))) {
    return "issue-row-danger";
  }

  if (checkFutureStart && isStartDateBeyondDashboardThreshold(issue)) {
    return "issue-row-success";
  }

  return "";
}

function isDueToday(issue) {
  return isSameDate(issue.due_date, new Date());
}

function isFutureDevelopmentIssue(issue) {
  return getTrackerName(issue) === "開発" && isDateAfter(issue.start_date, new Date());
}

function isStartDateBeyondDashboardThreshold(issue) {
  if (!issue.start_date) {
    return false;
  }

  const today = startOfDay(new Date());
  const startDate = startOfDay(issue.start_date);
  const diffDays = Math.floor((startDate.getTime() - today.getTime()) / 86400000);
  const thresholdDays = today.getDay() === 5 ? 3 : 1;
  return diffDays > thresholdDays;
}

function isDateAfter(value, target) {
  if (!value) {
    return false;
  }
  return startOfDay(value).getTime() > startOfDay(target).getTime();
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
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${escapeHtml(issue.id)}</a></td>
      <td>${escapeHtml((issue.project && issue.project.name) || "-")}</td>
      <td>${escapeHtml(issue.subject || "-")}</td>
      <td>${escapeHtml((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${escapeHtml((issue.status && issue.status.name) || "-")}</span></td>
      <td>${escapeHtml(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${escapeHtml(formatDate(issue.due_date))}</span></td>
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

function reportIssueRows(issues) {
  const exportIssues = issues.length ? issues : [null];
  return exportIssues.map(reportIssueRow).join("");
}

function reportIssueRow(issue, index) {
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
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml((issue.project && issue.project.name) || "")}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${escapeHtml(issue.id)}</a></td>
      <td>${escapeHtml(issue.subject || "")}</td>
      <td></td>
      <td><span class="tag">${escapeHtml((issue.status && issue.status.name) || "-")}</span></td>
      <td>${escapeHtml(formatExcelDate(issue.start_date))}</td>
      <td>${escapeHtml(formatExcelDate(issue.due_date))}</td>
    </tr>
  `;
}

function myTaskRow(issue, index) {
  const issueUrl = getIssueUrl(issue);

  return `
    <tr>
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${escapeHtml(issue.id)}</a></td>
      <td>${escapeHtml((issue.project && issue.project.name) || "-")}</td>
      <td>${escapeHtml(issue.subject || "-")}</td>
      <td><span class="tag">${escapeHtml((issue.status && issue.status.name) || "-")}</span></td>
      <td>${escapeHtml(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${escapeHtml(formatDate(issue.due_date))}</span></td>
    </tr>
  `;
}

function loginTimeRow(issue, index) {
  const issueUrl = getIssueUrl(issue);
  const user114Flag = issue.hasUser114SpentTime ? "true" : "false";

  return `
    <tr data-has-user114-spent="${user114Flag}">
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${escapeHtml(issue.id)}</a></td>
      <td>${escapeHtml(formatHours(issue.loginSpentHours))}</td>
      <td>${escapeHtml(issue.subject || "-")}</td>
      <td>${escapeHtml((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${escapeHtml((issue.status && issue.status.name) || "-")}</span></td>
      <td>${escapeHtml(formatDate(issue.start_date))}</td>
      <td><span class="${isOverdue(issue) ? "tag warn" : ""}">${escapeHtml(formatDate(issue.due_date))}</span></td>
    </tr>
    ${timeEntryDetails(issue.loginSpentEntries || [], issue.hasUser114SpentTime)}
  `;
}

function timeEntryDetails(entries, hasUser114SpentTime) {
  if (!entries.length) {
    return "";
  }

  return entries.map((entry) => timeEntryDetail(entry, hasUser114SpentTime)).join("");
}

function timeEntryDetail(entry, hasUser114SpentTime) {
  const user114Flag = hasUser114SpentTime ? "true" : "false";

  return `
    <tr class="time-entry-detail-row" data-has-user114-spent="${user114Flag}">
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
  els.processingRows.innerHTML = `<tr><td colspan="9" class="empty-cell">${safeMessage}</td></tr>`;
  els.notStartedRows.innerHTML = `<tr><td colspan="10" class="empty-cell">${safeMessage}</td></tr>`;
  els.processedRows.innerHTML = `<tr><td colspan="10" class="empty-cell">${safeMessage}</td></tr>`;
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
  return config.proxyUrl || config.baseUrl || "";
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
