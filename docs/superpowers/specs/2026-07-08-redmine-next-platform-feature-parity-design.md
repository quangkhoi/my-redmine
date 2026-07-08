# Redmine Next Platform - Feature Parity Design Spec (Revised)

## Overview

Bridging the feature gap between `my-redmine` (legacy static SPA) and `redmine-next-platform` (modern Next.js + .NET 10 stack).

**Current state:** Backend has all 5 core endpoints. Frontend has basic rendering but lacks interactive controls, filtering, export.

**Revised after Senior QA review:** Removed dead code, deferred low-value features, prioritized core parity.

---

## What's ALREADY Working (No changes needed)

| Feature | Status |
|---------|--------|
| Dashboard: Date range picker, Load button, 3 tables, progress bars, release target, issue links | ✅ |
| Dashboard: Summary metric cards (Processing/NotStarted/Processed counts) | ✅ |
| Dashboard: Overdue row highlighting (red bg) | ✅ |
| Daily Report: Issues grouped by assignee + Other section | ✅ |
| Weekly Report: 4 sections (prev/current C#/Web), spent hours | ✅ |
| My Task: Basic issue list (IssueKey, Subject, Status) | ✅ (needs richer data) |
| Log Time: Basic issue + hours display | ✅ (needs user/year-month controls) |
| All: Loading/error/empty states | ✅ |
| All: Issue links to Redmine (Dashboard, DailyReport via IssueId, WeeklyReport) | ✅ |

---

## What to REMOVE (Dead code / Low value)

| Item | Reason |
|------|--------|
| `DashboardPanel.tsx` | Dead code - not imported anywhere |
| `AdminDashboard.tsx` | Dead code - refresh button has no onClick |
| `IssuesPage.tsx` + `issues/page.tsx` | Hardcoded mock data, not in my-redmine |
| `axios`, `swr` packages | Installed but never used |
| Nav items: Projects, Agile Boards, Time Tracking, Wiki, Docs | No pages, not in my-redmine |
| Empty placeholder dirs: `schemas/`, `hooks/use-cases/` | No value |
| Per-list reload buttons (Dashboard) | Over-engineering - single Load is sufficient |
| LogTime time entry details | Deferred - hours total is sufficient for MVP |
| LogTime "hide logged tickets" filter | Deferred - depends on time entry details |
| Loading skeletons | Deferred - cosmetic, not feature parity |
| Error boundaries | Deferred - production hardening |

---

## Phase 0: Cleanup

### Files to DELETE:
- `frontend/src/components/features/dashboard/DashboardPanel.tsx`
- `frontend/src/components/features/dashboard/AdminDashboard.tsx`
- `frontend/src/components/features/issues/IssuesPage.tsx`
- `frontend/src/app/(admin)/issues/page.tsx`

### Files to MODIFY:
- `frontend/package.json` - Remove `axios`, `swr`
- `frontend/src/config/navigation.ts` - Add Daily Report, remove unused items

### Config constants to CREATE:
- `frontend/src/config/team.ts` - ASSIGNEES, DAILY_REPORT_ASSIGNEES, etc.
- `frontend/src/config/issue-filters.ts` - Status/tracker name constants
- `frontend/src/lib/date-utils.ts` - Date helpers
- `frontend/src/lib/issue-url.ts` - getIssueUrl() helper

---

## Phase 1: Backend Schema Extensions

### 1.1 MyTask - Add fields

**Current:** `MyTaskItem(IssueKey, Subject, Status)`

**New:** `MyTaskItem(IssueKey, Subject, Status, ProjectName, StartDate, DueDate, DoneRatio, TrackerName)`

Files:
- `Domain/MyTask/MyTaskItem.cs` - Add 5 fields
- `Infrastructure/Features/MyTask/MyTaskReader.cs` - Map from RedmineIssueDto
- `Application/Features/MyTask/Queries/GetMyTask/GetMyTaskResponse.cs` - Add to GetMyTaskItemResponse
- `Api/Contracts/MyTask/GetMyTaskResponseContract.cs` - Add to contract
- `Api/Contracts/MyTask/MyTaskContractMapper.cs` - Auto-mapped by Mapperly

### 1.2 LogTime - Add fields (NO time entry details)

**Current:** `LogTimeItem(IssueKey, Subject, Status, HoursLogged)`

**New:** `LogTimeItem(IssueId, IssueKey, Subject, Status, HoursLogged, AssigneeName, StartDate, DueDate)`

Files:
- `Domain/LogTime/LogTimeItem.cs` - Add 4 fields (IssueId, AssigneeName, StartDate, DueDate)
- `Infrastructure/Features/LogTime/LogTimeReader.cs` - Map new fields
- `Application/Features/LogTime/Queries/GetLogTime/GetLogTimeResponse.cs` - Add to GetLogTimeItemResponse
- `Api/Contracts/LogTime/GetLogTimeResponseContract.cs` - Add to contract
- `Api/Contracts/LogTime/LogTimeContractMapper.cs` - Auto-mapped by Mapperly

### 1.3 Unit tests
- Update `MyTaskReaderTests.cs` - Verify new fields mapped
- Update `LogTimeReaderTests.cs` - Verify new fields mapped
- Update `GetMyTaskUseCaseTests.cs` - Verify response includes new fields

---

## Phase 2: Dashboard Enhancement

### 2.1 Filter checkboxes (DashboardIssuesPanel.tsx)
- "Hide non-開発" checkbox for Not Started list
- "Hide 調査" checkbox for Processed list
- Client-side filtering after data loads
- `getVisibleDashboardIssues(issues, listName, filters)` helper

### 2.2 Enhanced row highlighting (DashboardIssuesPanel.tsx)
- Processing: red bg if `dueDate <= today` (expand existing logic)
- Not Started: red bg if tracker="開発" AND `startDate <= today`
- Not Started: green bg if `startDate` = today+1 (or today+3 if Friday)
- Create `lib/highlight.ts` with shared highlighting functions

### 2.3 Show additional columns
- Display `statusName` column (data already in API response)
- Display `spentHours` column (data already in API response)

### 2.4 Global search
- Add search input in AdminShell header (replace Cmd+K placeholder)
- Create `SearchContext` (React Context) with debounced search term
- Each panel filters its data by search term before rendering
- Highlight matching text in results

---

## Phase 3: MyTask + LogTime Controls

### 3.1 MyTaskPanel.tsx
- User dropdown (6 members from config/team.ts)
- Date range filter (start/end date inputs)
- Pass startDate/endDate to API (backend already supports)
- Default: previous Monday to next Friday
- Richer columns: Project, Start Date, Due Date, Progress bar
- Row highlighting: processing=red-if-due, notStarted=red-if-past-dev/green-if-threshold
- Issue links

### 3.2 LogTimePanel.tsx
- User filter dropdown (ALL + 6 members)
- Year dropdown (current year ±3)
- Month dropdown (1-12)
- Construct reportDate from year/month
- Issue links

### 3.3 Frontend service/hook updates
- `services/my-task/getMyTask.ts` - Add startDate, endDate params
- `hooks/queries/useMyTask.ts` - Accept startDate, endDate, re-fetch on change
- `services/log-time/getLogTime.ts` - Add user param (for future ALL support)
- `hooks/queries/useLogTime.ts` - Accept new params, re-fetch on change
- `types/api/my-task.ts` - Add new fields
- `types/api/log-time.ts` - Add new fields
- Page files: Remove hardcoded props, use component state

---

## Phase 4: Reports

### 4.1 DailyReportPanel.tsx
- Date picker (replace hardcoded props, default=today)
- Copy to clipboard button (HTML for Slack, plain text fallback)
- Circled numbers ①②③ prefix on issues
- Issue links (issueKey → `<a href="redmineUrl">`)

### 4.2 WeeklyReportPanel.tsx
- Week selector (date picker or prev/next week buttons, default=current Monday)
- Excel export (SheetJS/xlsx package)
  - Sections: 先週の作業 / 今週の計画
  - Columns: No, クライアント名, チケットID, タイトル, 課題, ステータス, 開始日, 終了日
  - Hyperlinked issue IDs
- Issue links in table

### 4.3 Frontend updates
- `app/(admin)/daily-report/page.tsx` - Remove hardcoded props
- `app/(admin)/weekly-report/page.tsx` - Remove hardcoded props
- Install `xlsx` package for Excel export

---

## File Change Summary

### DELETE (Phase 0):
| File | Reason |
|------|--------|
| `components/features/dashboard/DashboardPanel.tsx` | Dead code |
| `components/features/dashboard/AdminDashboard.tsx` | Dead code |
| `components/features/issues/IssuesPage.tsx` | Mock data |
| `app/(admin)/issues/page.tsx` | Mock data |

### CREATE (Phase 0-4):
| File | Purpose |
|------|---------|
| `config/team.ts` | Team member constants |
| `config/issue-filters.ts` | Status/tracker filter constants |
| `lib/date-utils.ts` | Date helpers |
| `lib/issue-url.ts` | getIssueUrl() helper |
| `lib/highlight.ts` | Row highlighting logic |
| `contexts/SearchContext.tsx` | Global search state |

### MODIFY (Phase 0-4):
| File | Changes |
|------|---------|
| `package.json` | Remove axios/swr, add xlsx |
| `config/navigation.ts` | Add Daily Report, remove unused |
| `components/layouts/AdminShell.tsx` | Add search input |
| `components/features/dashboard/DashboardIssuesPanel.tsx` | Filters, highlighting, new columns |
| `components/features/daily-report/DailyReportPanel.tsx` | Date picker, copy, circled nums, links |
| `components/features/weekly-report/WeeklyReportPanel.tsx` | Week selector, Excel export, links |
| `components/features/my-task/MyTaskPanel.tsx` | User dropdown, date range, columns, highlighting |
| `components/features/login-time/LogTimePanel.tsx` | User filter, year/month, links |
| `hooks/queries/useMyTask.ts` | Accept date params |
| `hooks/queries/useLogTime.ts` | Accept user param |
| `services/my-task/getMyTask.ts` | Pass date params |
| `services/log-time/getLogTime.ts` | Pass user param |
| `types/api/my-task.ts` | Add fields |
| `types/api/log-time.ts` | Add fields |
| `app/(admin)/my-task/page.tsx` | Remove hardcoded props |
| `app/(admin)/log-time/page.tsx` | Remove hardcoded props |
| `app/(admin)/daily-report/page.tsx` | Remove hardcoded props |
| `app/(admin)/weekly-report/page.tsx` | Remove hardcoded props |
| Backend: MyTask domain/response/contract/reader | Add 5 fields |
| Backend: LogTime domain/response/contract/reader | Add 4 fields |
