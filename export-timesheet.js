const TIMESHEET_STYLE = {
  title: 1,
  label: 9,
  header: 3,
  body: 5,
  center: 6,
  link: 10,
  weekend: 8,
  totalLabel: 9,
};
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WORKING_HOURS_PER_DAY = 8;

els.exportLogTime = document.querySelector("#exportLogTime");

async function exportLogTimeReport() {
  if (!window.XLSX || !window.XLSX.utils || !window.XLSX.writeFile) {
    setStatus("Could not export Excel file. XLSX library is not loaded.", "error");
    return;
  }
  if (typeof MEMBERS_CONFIG === "undefined" || !Array.isArray(MEMBERS_CONFIG) || !MEMBERS_CONFIG.length) {
    setStatus("MEMBERS_CONFIG is empty or not loaded.", "error");
    return;
  }

  const range = getSelectedLoginMonthRange();
  els.exportLogTime.disabled = true;
  beginGlobalLoading();
  setStatus(`Exporting timesheet for ${range.year}/${pad2(range.month)}...`);

  try {
    requireRuntimeConfig();
    const members = MEMBERS_CONFIG.slice().sort(
      (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
    );
    const monthStartKey = `${range.year}-${pad2(range.month)}-`;
    const monthEndDay = pad2(new Date(range.year, range.month, 0).getDate());
    const memberEntries = await Promise.all(
      members.map(async (member) => {
        const entries = await fetchTimeEntryPages({
          userId: member.id,
          spentFrom: range.monthStart,
          spentTo: range.monthEnd,
        });
        return {
          member,
          entries: sortTimeEntries(
            entries.filter((entry) => {
              const spentOn = String(entry.spent_on || "");
              return spentOn >= monthStartKey && spentOn <= `${monthStartKey}${monthEndDay}`;
            })
          ),
        };
      })
    );

    const workbook = window.XLSX.utils.book_new();
    memberEntries.forEach(({ member, entries }) => {
      const sheetName = `報告書_${range.month}月_${member.name.replace(/\s+/g, "")}`;
      window.XLSX.utils.book_append_sheet(workbook, buildTimesheetSheet(entries, member, range), sheetName);
    });
    window.XLSX.writeFile(workbook, `WorkingSummary_${range.month}月_${formatTimestamp(new Date())}.xlsx`);
    setStatus(`Exported ${MEMBERS_CONFIG.length} member sheets for ${range.year}/${pad2(range.month)}.`, "ok");
  } catch (error) {
    setStatus(`Could not export timesheet: ${error.message}`, "error");
  } finally {
    els.exportLogTime.disabled = false;
    endGlobalLoading();
  }
}

function buildTimesheetSheet(entries, member, range) {
  const rows = [];
  const styles = {};
  const merges = [];

  function setCell(row, col, value, style) {
    if (!rows[row]) {
      rows[row] = [];
    }
    rows[row][col] = value;
    if (style) {
      styles[window.XLSX.utils.encode_cell({ r: row, c: col })] = style;
    }
  }

  setCell(1, 1, "Working Timesheet Report", TIMESHEET_STYLE.title);
  for (let infoRow = 3; infoRow <= 5; infoRow += 1) {
    for (let infoCol = 1; infoCol <= 8; infoCol += 1) {
      setCell(infoRow, infoCol, "", TIMESHEET_STYLE.body);
    }
  }
  setCell(3, 1, "Project", TIMESHEET_STYLE.label);
  setCell(3, 2, "WDM", TIMESHEET_STYLE.body);
  setCell(3, 5, "Employee ID", TIMESHEET_STYLE.label);
  setCell(3, 6, member.employeeId || "", TIMESHEET_STYLE.body);
  setCell(4, 1, "Name", TIMESHEET_STYLE.label);
  setCell(4, 2, member.name, TIMESHEET_STYLE.body);
  setCell(4, 5, "Rank", TIMESHEET_STYLE.label);
  setCell(4, 6, member.rank || "", TIMESHEET_STYLE.body);
  setCell(5, 1, "Month", TIMESHEET_STYLE.label);
  setCell(5, 2, `${range.year}/${pad2(range.month)}`, TIMESHEET_STYLE.body);

  setCell(8, 1, "Date", TIMESHEET_STYLE.header);
  setCell(8, 2, "", TIMESHEET_STYLE.header);
  setCell(8, 3, "Working", TIMESHEET_STYLE.header);
  setCell(8, 4, "", TIMESHEET_STYLE.header);
  setCell(8, 5, "Log work", TIMESHEET_STYLE.header);
  setCell(8, 6, "Notes", TIMESHEET_STYLE.header);
  setCell(9, 1, "", TIMESHEET_STYLE.header);
  setCell(9, 2, "", TIMESHEET_STYLE.header);
  setCell(9, 3, "Type", TIMESHEET_STYLE.header);
  setCell(9, 4, "Description", TIMESHEET_STYLE.header);
  setCell(9, 5, "", TIMESHEET_STYLE.header);
  setCell(9, 6, "", TIMESHEET_STYLE.header);
  merges.push({ s: { r: 8, c: 1 }, e: { r: 9, c: 2 } });
  merges.push({ s: { r: 8, c: 3 }, e: { r: 8, c: 4 } });
  merges.push({ s: { r: 8, c: 5 }, e: { r: 9, c: 5 } });
  merges.push({ s: { r: 8, c: 6 }, e: { r: 9, c: 6 } });

  const entriesByDay = new Map();
  entries.forEach((entry) => {
    const key = String(entry.spent_on || "");
    if (!entriesByDay.has(key)) {
      entriesByDay.set(key, []);
    }
    entriesByDay.get(key).push(entry);
  });

  const daysInMonth = new Date(range.year, range.month, 0).getDate();
  let row = 10;
  let totalHours = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateObj = new Date(range.year, range.month - 1, day);
    const weekday = dateObj.getDay();
    const dateLabel = `${pad2(range.month)}/${pad2(day)}`;
    const dayName = DAY_NAMES[weekday];
    const dayEntries = entriesByDay.get(`${range.year}-${pad2(range.month)}-${pad2(day)}`) || [];

    if (weekday === 0 || weekday === 6) {
      setCell(row, 1, dateLabel, TIMESHEET_STYLE.weekend);
      setCell(row, 2, dayName, TIMESHEET_STYLE.weekend);
      setCell(row, 3, "", TIMESHEET_STYLE.weekend);
      setCell(row, 4, "", TIMESHEET_STYLE.weekend);
      setCell(row, 5, "", TIMESHEET_STYLE.weekend);
      setCell(row, 6, "", TIMESHEET_STYLE.weekend);
      row += 1;
      continue;
    }

    if (!dayEntries.length) {
      setCell(row, 1, dateLabel, TIMESHEET_STYLE.center);
      setCell(row, 2, dayName, TIMESHEET_STYLE.center);
      setCell(row, 3, "Non-Ticket", TIMESHEET_STYLE.center);
      setCell(row, 4, "-", TIMESHEET_STYLE.body);
      setCell(row, 5, WORKING_HOURS_PER_DAY, TIMESHEET_STYLE.center);
      setCell(row, 6, "", TIMESHEET_STYLE.body);
      totalHours += WORKING_HOURS_PER_DAY;
      row += 1;
      continue;
    }

    let dayLogged = 0;
    dayEntries.forEach((entry) => {
      const hours = Number(entry.hours) || 0;
      const issueId = entry.issue && entry.issue.id ? Number(entry.issue.id) : null;
      const description = issueId
        ? {
            text: `https://redmine.wdm.co.jp/issues/${issueId}`,
            hyperlink: `${normalizeBaseUrl(REDMINE.baseUrl)}/issues/${issueId}`,
          }
        : "-";
      setCell(row, 1, dateLabel, TIMESHEET_STYLE.center);
      setCell(row, 2, dayName, TIMESHEET_STYLE.center);
      setCell(row, 3, issueId ? "On-Ticket" : "Non-Ticket", TIMESHEET_STYLE.center);
      setCell(row, 4, description, issueId ? TIMESHEET_STYLE.link : TIMESHEET_STYLE.body);
      setCell(row, 5, hours, TIMESHEET_STYLE.center);
      setCell(row, 6, entry.comments || "", TIMESHEET_STYLE.body);
      dayLogged += hours;
      totalHours += hours;
      row += 1;
    });

    const remain = Math.round((WORKING_HOURS_PER_DAY - dayLogged) * 100) / 100;
    if (remain > 0) {
      setCell(row, 1, dateLabel, TIMESHEET_STYLE.center);
      setCell(row, 2, dayName, TIMESHEET_STYLE.center);
      setCell(row, 3, "Non-Ticket", TIMESHEET_STYLE.center);
      setCell(row, 4, "-", TIMESHEET_STYLE.body);
      setCell(row, 5, remain, TIMESHEET_STYLE.center);
      setCell(row, 6, "", TIMESHEET_STYLE.body);
      totalHours += remain;
      row += 1;
    }
  }

  setCell(4, 7, "Total of Month", TIMESHEET_STYLE.totalLabel);
  setCell(4, 8, Math.round(totalHours * 100) / 100, TIMESHEET_STYLE.center);

  const sheet = window.XLSX.utils.aoa_to_sheet(rows);
  Object.keys(styles).forEach((address) => {
    if (!sheet[address]) {
      sheet[address] = { t: "s", v: "" };
    }
    sheet[address].s = styles[address];
  });
  sheet["!merges"] = merges;
  sheet["!cols"] = [4.5, 10, 7, 12, 45, 10, 35, 16, 8].map(reportColumnWidth);
  sheet["!rows"] = [];
  sheet["!rows"][1] = { hpt: 18 };
  return sheet;
}

els.exportLogTime.addEventListener("click", exportLogTimeReport);
