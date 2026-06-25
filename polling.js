const WATCH_CONFIG_KEY = "myRedmineWatch";
const WATCH_DATE_KEY = "myRedmineWatchDate";
const WATCH_SEEN_IDS_KEY = "myRedmineSeenIds";
const WATCH_COUNT_KEY = "myRedmineWatchCount";
const WATCH_ISSUES_KEY = "myRedmineUpdatedIssues";

const elsWatch = {
  toggle: document.querySelector("#watchToggle"),
  interval: document.querySelector("#watchInterval"),
  badge: document.querySelector("#watchBadge"),
  section: document.querySelector("#updatedSection"),
  info: document.querySelector("#updatedInfo"),
  rows: document.querySelector("#updatedRows"),
};

let watchTimer = null;
let pollScheduled = false;

function initPolling() {
  try {
    const config = loadWatchConfig();

    if (elsWatch.toggle) {
      elsWatch.toggle.checked = config.enabled;
      elsWatch.toggle.addEventListener("change", toggleWatch);
    }
    if (elsWatch.interval) {
      elsWatch.interval.value = String(config.interval);
      elsWatch.interval.addEventListener("change", onWatchConfigChange);
    }

    const bind = (id, event, fn) => {
      const el = document.querySelector(id);
      if (el) { el.addEventListener(event, fn); }
    };
    bind("#loadDashboard", "click", clearBadge);
    bind("#reloadProcessing", "click", clearBadge);
    bind("#reloadNotStarted", "click", clearBadge);
    bind("#reloadProcessed", "click", clearBadge);
    bind("#dismissUpdates", "click", dismissUpdates);

    document.addEventListener("visibilitychange", onVisibilityChange);
    if (elsWatch.rows) {
      elsWatch.rows.addEventListener("click", onUpdatedRowClick);
    }

    restoreWatchState();

    if (config.enabled && elsWatch.toggle && elsWatch.toggle.checked) {
      startPolling();
    }
  } catch (e) {
    console.error("[Watch] init error:", e);
  }
}

function loadWatchConfig() {
  try {
    const raw = localStorage.getItem(WATCH_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return { enabled: true, interval: 3 };
}

function saveWatchConfig() {
  localStorage.setItem(
    WATCH_CONFIG_KEY,
    JSON.stringify({
      enabled: elsWatch.toggle.checked,
      interval: Number(elsWatch.interval.value),
    })
  );
}

function toggleWatch() {
  saveWatchConfig();
  if (elsWatch.toggle.checked) {
    startPolling();
  } else {
    stopPolling();
    newIssueCount = 0;
    localStorage.setItem(WATCH_COUNT_KEY, "0");
    localStorage.removeItem(WATCH_ISSUES_KEY);
    hideBadge();
    hideUpdatedSection();
  }
}

function onWatchConfigChange() {
  saveWatchConfig();
  if (watchTimer) {
    startPolling();
  }
}

function resetWatchState() {
  localStorage.removeItem(WATCH_DATE_KEY);
  localStorage.removeItem(WATCH_SEEN_IDS_KEY);
  localStorage.removeItem(WATCH_COUNT_KEY);
  localStorage.removeItem(WATCH_ISSUES_KEY);
}

function startPolling() {
  stopPolling();
  const today = formatApiDate(new Date());
  localStorage.setItem(WATCH_DATE_KEY, today);
  localStorage.setItem(WATCH_COUNT_KEY, "0");
  pollScheduled = true;
  setStatus(`Watch started (every ${elsWatch.interval.value} min).`, "ok");
  checkForUpdates();
  scheduleNextPoll();
}

function scheduleNextPoll() {
  if (!pollScheduled) {
    return;
  }
  const ms = Number(elsWatch.interval.value) * 60 * 1000;
  watchTimer = setTimeout(async () => {
    try {
      if (!pollScheduled) {
        return;
      }
      await checkForUpdates();
    } catch (e) {
      console.error("[Watch] poll error:", e);
    }
    scheduleNextPoll();
  }, ms);
}

function stopPolling() {
  pollScheduled = false;
  if (watchTimer) {
    clearTimeout(watchTimer);
    watchTimer = null;
  }
}

function onUpdatedRowClick(e) {
  const btn = e.target.closest(".dismiss-btn");
  if (btn) {
    const row = btn.closest("tr");
    if (row) {
      dismissIssue(Number(row.dataset.issueId));
    }
  }
}

function onVisibilityChange() {
  if (!document.hidden && elsWatch.toggle.checked && watchTimer) {
    checkForUpdates();
  }
}

function restoreWatchState() {
  try {
    const count = parseInt(localStorage.getItem(WATCH_COUNT_KEY) || "0", 10);
    if (count > 0) {
      newIssueCount = count;
      showBadge(count);
      renderUpdatedSection();
    }
  } catch {}
}

async function checkForUpdates() {
  const today = formatApiDate(new Date());
  const watchDate = localStorage.getItem(WATCH_DATE_KEY);

  if (!watchDate) {
    localStorage.setItem(WATCH_DATE_KEY, today);
  }

  const apiBaseUrl = normalizeBaseUrl(getApiBaseUrl());
  if (!apiBaseUrl) {
    return;
  }

  try {
    const url = new URL(`${apiBaseUrl}/issues.json`);
    url.searchParams.set("sort", "updated_on:desc");
    url.searchParams.set("limit", "100");
    url.searchParams.set("status_id", "*");

    const data = await redmineGet(url);
    const issues = Array.isArray(data.issues) ? data.issues : [];

    const seenIds = loadSeenIds();
    const newIssues = [];

    for (const issue of issues) {
      const assigneeId = Number(issue.assigned_to && issue.assigned_to.id);
      if (!dashboardAssigneeIdSet.has(assigneeId)) {
        continue;
      }
      const issueDate = String(issue.updated_on || "").substring(0, 10);
      if (watchDate && issueDate && issueDate < watchDate) {
        continue;
      }
      const id = Number(issue.id);
      const updatedOn = String(issue.updated_on || "");
      const lastSeen = seenIds.get(id);
      if (!lastSeen || updatedOn > lastSeen) {
        seenIds.set(id, updatedOn);
        newIssues.push(issue);
      }
    }

    if (newIssues.length > 0) {
      // Reload issues list from localStorage to pick up any dismissals
      // that happened during the async API call above
      const currentIssues = loadUpdatedIssues();
      const updated = currentIssues.concat(newIssues);
      localStorage.setItem(WATCH_ISSUES_KEY, JSON.stringify(updated));

      const total = newIssueCount + newIssues.length;
      newIssueCount = total;
      localStorage.setItem(WATCH_COUNT_KEY, String(total));
      showBadge(total);
      renderUpdatedSection();
      setStatus(`Watch: ${newIssues.length} new issue(s) found.`, "ok");
    } else {
      setStatus("Watch: no new issues.", "ok");
    }

    // Always save seenIds to capture any dismissals made during the async call
    localStorage.setItem(WATCH_SEEN_IDS_KEY, JSON.stringify(Object.fromEntries(seenIds)));
  } catch {
    /* silent */
  }
}

function loadSeenIds() {
  try {
    const stored = localStorage.getItem(WATCH_SEEN_IDS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Old format: [1,2,3] — migrate to Map with current time
        const now = new Date().toISOString();
        return new Map(parsed.map((id) => [Number(id), now]));
      }
      if (typeof parsed === "object" && parsed !== null) {
        return new Map(Object.entries(parsed).map(([k, v]) => [Number(k), String(v)]));
      }
    }
  } catch {}
  return new Map();
}

function loadUpdatedIssues() {
  try {
    const stored = localStorage.getItem(WATCH_ISSUES_KEY);
    if (stored) {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr)) {
        return arr;
      }
    }
  } catch {}
  return [];
}

function showBadge(count) {
  elsWatch.badge.textContent = count > 99 ? "99+" : String(count);
  elsWatch.badge.style.display = "";
}

function hideBadge() {
  elsWatch.badge.style.display = "none";
}

function renderUpdatedSection() {
  const issues = loadUpdatedIssues();
  if (issues.length === 0) {
    hideUpdatedSection();
    return;
  }

  elsWatch.section.style.display = "";
  elsWatch.info.textContent = `${issues.length} issue`;
  elsWatch.rows.innerHTML = issues.map(updatedIssueRow).join("");
}

function hideUpdatedSection() {
  elsWatch.section.style.display = "none";
  elsWatch.rows.innerHTML = "";
}

function markIssuesSeen(issues) {
  if (!issues || issues.length === 0) {
    return;
  }
  const seenIds = loadSeenIds();
  issues.forEach((issue) => {
    const id = Number(issue.id);
    const updatedOn = String(issue.updated_on || new Date().toISOString());
    seenIds.set(id, updatedOn);
  });
  localStorage.setItem(WATCH_SEEN_IDS_KEY, JSON.stringify(Object.fromEntries(seenIds)));
}

function dismissUpdates() {
  const issues = loadUpdatedIssues();
  markIssuesSeen(issues);
  newIssueCount = 0;
  localStorage.setItem(WATCH_COUNT_KEY, "0");
  localStorage.removeItem(WATCH_ISSUES_KEY);
  hideBadge();
  hideUpdatedSection();
  setStatus(`Dismissed ${issues.length} update(s).`, "ok");
}

function dismissIssue(id) {
  const issues = loadUpdatedIssues();
  const dismissed = issues.find((i) => Number(i.id) === id);
  const kept = issues.filter((i) => Number(i.id) !== id);

  if (kept.length === issues.length) {
    return;
  }

  if (dismissed) {
    markIssuesSeen([dismissed]);
  }

  if (kept.length > 0) {
    localStorage.setItem(WATCH_ISSUES_KEY, JSON.stringify(kept));
    newIssueCount = kept.length;
    localStorage.setItem(WATCH_COUNT_KEY, String(kept.length));
    showBadge(kept.length);
    renderUpdatedSection();
  } else {
    newIssueCount = 0;
    localStorage.setItem(WATCH_COUNT_KEY, "0");
    localStorage.removeItem(WATCH_ISSUES_KEY);
    hideBadge();
    hideUpdatedSection();
  }
}

function updatedIssueRow(issue, index) {
  const issueUrl = getIssueUrl(issue);
  const done = Math.max(0, Math.min(100, Number(issue.done_ratio) || 0));

  return `
    <tr data-issue-id="${escapeAttr(issue.id)}">
      <td>${index + 1}</td>
      <td><a class="issue-link" href="${escapeAttr(issueUrl)}" target="_blank" rel="noreferrer">#${escapeHtml(issue.id)}</a></td>
      <td>${escapeHtml((issue.project && issue.project.name) || "-")}</td>
      <td>${escapeHtml(issue.subject || "-")}</td>
      <td>${escapeHtml((issue.assigned_to && issue.assigned_to.name) || "-")}</td>
      <td><span class="tag">${escapeHtml((issue.status && issue.status.name) || "-")}</span></td>
      <td>
        ${done}%
        <div class="done-bar" aria-hidden="true"><span style="width: ${done}%"></span></div>
      </td>
      <td>${escapeHtml(formatDate(issue.updated_on))}</td>
      <td><button class="dismiss-btn" title="Dismiss this">✕</button></td>
    </tr>
  `;
}

function clearBadge() {
  const issues = loadUpdatedIssues();
  markIssuesSeen(issues);
  newIssueCount = 0;
  localStorage.setItem(WATCH_COUNT_KEY, "0");
  localStorage.removeItem(WATCH_ISSUES_KEY);
  hideBadge();
  hideUpdatedSection();
}

let newIssueCount = (() => {
  try {
    return parseInt(localStorage.getItem(WATCH_COUNT_KEY) || "0", 10);
  } catch {
    return 0;
  }
})();

initPolling();
