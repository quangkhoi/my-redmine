const WATCH_CONFIG_KEY = "myRedmineWatch";
const WATCH_DATE_KEY = "myRedmineWatchDate";
const WATCH_SEEN_IDS_KEY = "myRedmineSeenIds";
const WATCH_COUNT_KEY = "myRedmineWatchCount";
const WATCH_ISSUES_KEY = "myRedmineUpdatedIssues";
const WATCH_PARENT_IDS_KEY = "myRedmineWatchParentIds";
const NOTIF_PERM_KEY = "myRedmineNotifPerm";

const WATCH_RELATION_LABELS = { direct: "Direct", parent: "Parent", sibling: "Sibling" };

const FAVICON_NORMAL = "./favicon.svg";
const FAVICON_BADGE = "./favicon-badge.svg";

const elsWatch = {
  toggle: document.querySelector("#watchToggle"),
  interval: document.querySelector("#watchInterval"),
  related: document.querySelector("#watchRelatedToggle"),
  badge: document.querySelector("#watchBadge"),
  section: document.querySelector("#updatedSection"),
  info: document.querySelector("#updatedInfo"),
  rows: document.querySelector("#updatedRows"),
};

let watchTimer = null;
let pollScheduled = false;

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return;
  }
  if (Notification.permission === "granted") {
    return;
  }
  if (Notification.permission === "denied") {
    return;
  }
  Notification.requestPermission();
}

function showUpdateNotification(issues) {
  if (!("Notification" in window)) {
    return;
  }
  if (Notification.permission !== "granted") {
    return;
  }
  const count = issues.length;
  const title = count === 1 ? "1 issue updated" : `${count} issues updated`;
  const lines = issues.slice(0, 5).map((issue) => {
    const assignee = issue.assigned_to && issue.assigned_to.name ? issue.assigned_to.name : "-";
    const relation = issue.watchRelation || "direct";
    const tag = relation === "direct" ? "" : ` (${relation})`;
    return `#${issue.id}${tag} – ${assignee}`;
  });
  if (count > 5) {
    lines.push(`… and ${count - 5} more issues`);
  }
  lines.push("Click to view on Redmine Dashboard");
  try {
    const n = new Notification(title, {
      body: lines.join("\n"),
      icon: FAVICON_BADGE,
      tag: "redmine-watch",
      renotify: true,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {}
}

function setFaviconBadge() {
  const link = document.querySelector("link[rel~='icon']");
  if (link && link.href !== FAVICON_BADGE) {
    link.href = FAVICON_BADGE;
  }
}

function clearFaviconBadge() {
  const link = document.querySelector("link[rel~='icon']");
  if (link && link.href !== FAVICON_NORMAL) {
    link.href = FAVICON_NORMAL;
  }
}

function updateTitle(count) {
  document.title = count > 0 ? `(${count}) Redmine Dashboard` : "Redmine Dashboard";
}

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
    if (elsWatch.related) {
      elsWatch.related.checked = config.relatedEnabled;
      elsWatch.related.addEventListener("change", onWatchRelatedChange);
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
      const config = JSON.parse(raw);
      return {
        enabled: !!config.enabled,
        interval: Number(config.interval) || 5,
        relatedEnabled: !!config.relatedEnabled,
      };
    }
  } catch {}
  return { enabled: false, interval: 5, relatedEnabled: false };
}

function saveWatchConfig() {
  localStorage.setItem(
    WATCH_CONFIG_KEY,
    JSON.stringify({
      enabled: elsWatch.toggle.checked,
      interval: Number(elsWatch.interval.value),
      relatedEnabled: !!(elsWatch.related && elsWatch.related.checked),
    })
  );
}

function onWatchRelatedChange() {
  saveWatchConfig();
  if (!elsWatch.related.checked) {
    purgeRelatedIssues();
  }
}

function toggleWatch() {
  saveWatchConfig();
  if (elsWatch.toggle.checked) {
    requestNotificationPermission();
    startPolling();
  } else {
    stopPolling();
    newIssueCount = 0;
    localStorage.setItem(WATCH_COUNT_KEY, "0");
    localStorage.removeItem(WATCH_ISSUES_KEY);
    hideBadge();
    updateTitle(0);
    hideUpdatedSection();
    clearFaviconBadge();
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
    const count = loadUpdatedIssues().length;
    if (count > 0) {
      newIssueCount = count;
      showBadge(count);
      updateTitle(count);
      setFaviconBadge();
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
    const parentIds = loadParentIds();
    const relatedEnabled = isRelatedWatchEnabled();
    let parentIdsChanged = false;

    issues.forEach((issue) => {
      const assigneeId = Number(issue.assigned_to && issue.assigned_to.id);
      const parentId = issue.parent ? Number(issue.parent.id) : 0;
      if (dashboardAssigneeIdSet.has(assigneeId) && parentId) {
        parentIds.add(parentId);
        parentIdsChanged = true;
      }
    });

    const newIssues = [];

    for (const issue of issues) {
      const assigneeId = Number(issue.assigned_to && issue.assigned_to.id);
      const isDirect = dashboardAssigneeIdSet.has(assigneeId);
      const parentId = issue.parent ? Number(issue.parent.id) : 0;
      let relation = "";
      if (isDirect) {
        relation = "direct";
      } else if (relatedEnabled && parentIds.has(Number(issue.id))) {
        relation = "parent";
      } else if (relatedEnabled && parentId && parentIds.has(parentId)) {
        relation = "sibling";
      }
      if (!relation) {
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
        issue.watchRelation = relation;
        newIssues.push(issue);
      }
    }

    if (parentIdsChanged) {
      localStorage.setItem(WATCH_PARENT_IDS_KEY, JSON.stringify(Array.from(parentIds)));
    }

    if (newIssues.length > 0) {
      // Reload issues list from localStorage to pick up any dismissals
      // that happened during the async API call above
      const currentIssues = loadUpdatedIssues();
      const mergedById = new Map(currentIssues.map((issue) => [Number(issue.id), issue]));
      newIssues.forEach((issue) => mergedById.set(Number(issue.id), issue));
      const updated = Array.from(mergedById.values());
      localStorage.setItem(WATCH_ISSUES_KEY, JSON.stringify(updated));

      const total = updated.length;
      newIssueCount = total;
      localStorage.setItem(WATCH_COUNT_KEY, String(total));
      showBadge(total);
      updateTitle(total);
      setFaviconBadge();
      showUpdateNotification(newIssues);
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

function isRelatedWatchEnabled() {
  return !!(elsWatch.related && elsWatch.related.checked);
}

function loadParentIds() {
  try {
    const stored = localStorage.getItem(WATCH_PARENT_IDS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map(Number).filter((id) => Number.isFinite(id)));
      }
    }
  } catch {}
  return new Set();
}

function getWatchRelation(issue) {
  return WATCH_RELATION_LABELS[(issue && issue.watchRelation) || "direct"] || "Direct";
}

function loadUpdatedIssues() {
  try {
    const stored = localStorage.getItem(WATCH_ISSUES_KEY);
    if (stored) {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr)) {
        const byId = new Map();
        arr.forEach((issue) => {
          const id = Number(issue.id);
          const prev = byId.get(id);
          if (!prev || String(issue.updated_on || "") > String(prev.updated_on || "")) {
            byId.set(id, issue);
          }
        });
        return Array.from(byId.values()).sort((a, b) => compareDate(b.updated_on, a.updated_on));
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
  const issues = typeof filterIssuesBySearch === "function"
    ? filterIssuesBySearch(loadUpdatedIssues())
    : loadUpdatedIssues();
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

function purgeRelatedIssues() {
  const issues = loadUpdatedIssues();
  const kept = issues.filter((issue) => (issue.watchRelation || "direct") === "direct");
  if (kept.length === issues.length) {
    return;
  }
  newIssueCount = kept.length;
  if (kept.length > 0) {
    localStorage.setItem(WATCH_ISSUES_KEY, JSON.stringify(kept));
    localStorage.setItem(WATCH_COUNT_KEY, String(kept.length));
    showBadge(kept.length);
    updateTitle(kept.length);
    renderUpdatedSection();
  } else {
    localStorage.setItem(WATCH_COUNT_KEY, "0");
    localStorage.removeItem(WATCH_ISSUES_KEY);
    hideBadge();
    updateTitle(0);
    hideUpdatedSection();
    clearFaviconBadge();
  }
}

function dismissUpdates() {
  const issues = loadUpdatedIssues();
  markIssuesSeen(issues);
  newIssueCount = 0;
  localStorage.setItem(WATCH_COUNT_KEY, "0");
  localStorage.removeItem(WATCH_ISSUES_KEY);
  hideBadge();
  updateTitle(0);
  hideUpdatedSection();
  clearFaviconBadge();
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
    updateTitle(kept.length);
    renderUpdatedSection();
  } else {
    newIssueCount = 0;
    localStorage.setItem(WATCH_COUNT_KEY, "0");
    localStorage.removeItem(WATCH_ISSUES_KEY);
    hideBadge();
    updateTitle(0);
    hideUpdatedSection();
    clearFaviconBadge();
  }
}

const UPDATED_TIME_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatUpdatedTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return `${date.getFullYear()} ${UPDATED_TIME_MONTHS[date.getMonth()]} ${pad2(date.getDate())} ${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
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
      <td><span class="tag">${escapeHtml(getWatchRelation(issue))}</span></td>
      <td><span class="tag">${escapeHtml((issue.status && issue.status.name) || "-")}</span></td>
      <td>${escapeHtml(formatDate(issue.start_date))}</td>
      <td>${escapeHtml(formatDate(issue.due_date))}</td>
      <td>
        ${done}%
        <div class="done-bar" aria-hidden="true"><span style="width: ${done}%"></span></div>
      </td>
      <td>${escapeHtml(formatUpdatedTime(issue.updated_on))}</td>
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
  updateTitle(0);
  hideUpdatedSection();
  clearFaviconBadge();
}

let newIssueCount = (() => {
  try {
    return loadUpdatedIssues().length;
  } catch {
    return 0;
  }
})();

initPolling();
