# Redmine Parity Compact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pull the new backend back toward `my-redmine` behavior for paging, weekly report, daily report, my task, and log time without expanding dashboard scope yet.

**Architecture:** Keep the current controller and use-case flow, but make the shared Redmine repository capable of full pagination and richer range filters. Then rebuild the feature readers around the old `app.js` business rules, changing API contracts only where the old behavior cannot fit the current DTOs.

**Tech Stack:** .NET 10, ASP.NET Core Web API, xUnit, existing frontend Next.js client for smoke validation.

---

### Task 1: Full paging in Redmine infrastructure

**Files:**
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Redmine/IRedmineClientFacade.cs`
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Redmine/IRedmineIssueRepository.cs`
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Redmine/RedmineClientFacade.cs`
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Redmine/RedmineIssueRepository.cs`
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Redmine/RedmineIssueQuery.cs`
- Modify: `redmine-next-platform/backend/tests/Unit/Infrastructure/Redmine/RedmineFacadeTests.cs`

- [ ] Add query fields for start date, due date, spent range, sort, limit, and offset.
- [ ] Write failing tests proving the facade emits `limit` and `offset`, and the repository keeps fetching until `total_count` is exhausted.
- [ ] Implement paged issue and time-entry fetching with the same range grammar the old app used.
- [ ] Run the targeted infrastructure tests.

### Task 2: Weekly report parity

**Files:**
- Modify: `redmine-next-platform/backend/redmine/Application/Features/WeeklyReport/**/*`
- Modify: `redmine-next-platform/backend/redmine/Domain/WeeklyReport/**/*`
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Features/WeeklyReport/WeeklyReportReader.cs`
- Modify: `redmine-next-platform/backend/redmine/Api/Contracts/WeeklyReport/**/*`
- Create or modify: `redmine-next-platform/backend/tests/Unit/Features/WeeklyReport/**/*`

- [ ] Write failing tests for previous/current week split, `C#` plus `WEB` grouping, and special assignee `114` development inclusion.
- [ ] Rebuild the reader around the old fetch flow: date windows, work-item filtering, dedupe, sort, and `reportSpentHours`.
- [ ] Expand the response shape so the API can represent `prevCsharp`, `prevWeb`, `currentCsharp`, `currentWeb`, `hasPrevious`, `range`, and `exportRange`.
- [ ] Run weekly-report unit tests.

### Task 3: Daily report parity

**Files:**
- Modify: `redmine-next-platform/backend/redmine/Application/Features/DailyReport/**/*`
- Modify: `redmine-next-platform/backend/redmine/Domain/DailyReport/**/*`
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Features/DailyReport/ DailyReportReader.cs`
- Modify: `redmine-next-platform/backend/redmine/Api/Contracts/DailyReport/**/*`
- Modify: `redmine-next-platform/backend/tests/Unit/Features/DailyReport/DailyReportReaderTests.cs`

- [ ] Write failing tests for assignee grouping, assignee `113/114` exclusion from standard groups, and the `Other` bucket rules.
- [ ] Rebuild the reader using the old merge logic: today issues, processing issues, and special `Other` issues.
- [ ] Change the API shape to return grouped sections plus `other` instead of a flat item list.
- [ ] Run daily-report unit tests.

### Task 4: My task and log time parity

**Files:**
- Modify: `redmine-next-platform/backend/redmine/Application/Features/MyTask/**/*`
- Modify: `redmine-next-platform/backend/redmine/Application/Features/LogTime/**/*`
- Modify: `redmine-next-platform/backend/redmine/Domain/MyTask/**/*`
- Modify: `redmine-next-platform/backend/redmine/Domain/LogTime/**/*`
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Features/MyTask/MyTaskReader.cs`
- Modify: `redmine-next-platform/backend/redmine/Infrastructure/Features/LogTime/LogTimeReader.cs`
- Modify: `redmine-next-platform/backend/redmine/Api/Controllers/MyTaskController.cs`
- Modify: `redmine-next-platform/backend/redmine/Api/Controllers/LogTimeController.cs`
- Modify: `redmine-next-platform/backend/redmine/Api/Contracts/MyTask/**/*`
- Modify: `redmine-next-platform/backend/redmine/Api/Contracts/LogTime/**/*`
- Create or modify: `redmine-next-platform/backend/tests/Unit/Features/MyTask/**/*`
- Create or modify: `redmine-next-platform/backend/tests/Unit/Features/LogTime/**/*`

- [ ] Write failing tests for my-task date range filters and excluded statuses.
- [ ] Write failing tests for log-time monthly range filters, work-item filtering, aggregated spent hours, and spent-user capture.
- [ ] Add query-parameter support while keeping endpoint names stable.
- [ ] Implement reader logic to match the old filters and result shapes closely enough for FE consumption.
- [ ] Run my-task and log-time tests.

### Task 5: Smoke validation and dashboard deferral

**Files:**
- Modify if needed: `redmine-next-platform/frontend/src/services/**/*`
- Modify if needed: `redmine-next-platform/frontend/src/types/api/**/*`
- Modify if needed: `redmine-next-platform/frontend/src/components/features/**/*`

- [ ] Keep dashboard unchanged for this pass.
- [ ] Update frontend callers only where backend contracts changed.
- [ ] Run `dotnet test redmine-next-platform/backend/RedmineNextPlatform.sln`.
- [ ] Hit the local API endpoints and, if they are stable, validate the corresponding screens in the browser at `http://localhost:3001`.
