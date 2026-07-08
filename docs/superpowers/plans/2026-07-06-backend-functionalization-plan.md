# Backend Functionalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace in-memory backend feature readers with production-ready data paths backed by the external Redmine API at `https://redmine.wdm.co.jp/`, while preserving the exact functional behavior of `my-redmine` for Dashboard, Daily Report, Weekly Report, My Task, and Log Time.

**Architecture:** Keep the current Clean Architecture split intact: API controllers stay thin, Application owns use cases and validation, Domain keeps data shapes, and Infrastructure becomes the adapter to the external Redmine API. The first implementation pass must preserve business rules, not just endpoint shapes, so the plan locks down functional parity in tests before any reader replacement happens. If future persistence or caching becomes necessary, PostgreSQL is the preferred relational option, but it is not required for the first pass.

**Tech Stack:** .NET 10, ASP.NET Core Web API, FluentValidation, xUnit, OneOf, existing contract mappers, existing unit/integration test projects.

---

### Functional Parity Contract

The new backend must include the old `my-redmine` behaviors:

- Dashboard:
  - status buckets must remain `Processing`, `Not started`, and `Processed`
  - date-window filtering and highlight rules must remain consistent with the old app
- Daily Report:
  - issues must be grouped by assignee
  - the special assignee exclusions must stay intact
  - the `Other` bucket must still exist
- Weekly Report:
  - previous/current week split must be preserved
  - export selection must keep working the same way
- My Task:
  - excluded statuses must remain excluded
  - the selected user and range behavior must remain stable
- Log Time:
  - logged-user filtering must remain available
  - time-entry detail rows must still render in the same data shape

If a change cannot satisfy one of these rules, it is out of scope until the missing rule is implemented.

The external Redmine integration must be configurable through `appsettings.json` using:

```json
{
  "Redmine": {
    "BaseUrl": "https://redmine.wdm.co.jp/",
    "ApiKey": "REPLACE_ME"
  }
}
```

If the API key is not available yet, the plan should keep the placeholder in config and fail fast with a clear startup or request-time error. PostgreSQL is only a fallback recommendation for later caching or local persistence, not a prerequisite for this phase.

---

### Task 1: Lock down functional parity with integration tests

**Files:**
- Modify: `backend/tests/Integration/Redmine.Tests.Integration.csproj`
- Create: `backend/tests/Integration/TestHostFactory.cs`
- Create: `backend/tests/Integration/Features/Dashboard/DashboardEndpointTests.cs`
- Create: `backend/tests/Integration/Features/DailyReport/DailyReportEndpointTests.cs`
- Create: `backend/tests/Integration/Features/WeeklyReport/WeeklyReportEndpointTests.cs`
- Create: `backend/tests/Integration/Features/MyTask/MyTaskEndpointTests.cs`
- Create: `backend/tests/Integration/Features/LogTime/LogTimeEndpointTests.cs`

- [ ] **Step 1: Add the test host package and project reference**

```xml
<ItemGroup>
  <ProjectReference Include="..\..\redmine\Api\Redmine.Api.csproj" />
  <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.0.0-preview.6.25358.103" />
</ItemGroup>
```

- [ ] **Step 2: Create a reusable test host factory for the API**

```csharp
using Microsoft.AspNetCore.Mvc.Testing;

public sealed class TestHostFactory : WebApplicationFactory<Program>
{
}
```

- [ ] **Step 3: Add one happy-path assertion per feature and assert real business content**

```csharp
using System.Net;
using System.Net.Http.Json;

public sealed class DashboardEndpointTests
{
    [Fact]
    public async Task Get_returns_processing_and_other_buckets_for_known_user()
    {
        using var client = TestHostFactory.CreateClient();

        var response = await client.GetAsync("/api/dashboard/2026-07-03/alice");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        var metrics = payload.GetProperty("metrics");
        Assert.True(metrics.GetArrayLength() > 0);
    }
}
```

- [ ] **Step 4: Add tests that capture old-report behavior, not just DTO shape**

```csharp
[Fact]
public async Task Daily_report_keeps_assignee_grouping_contract()
{
    using var client = TestHostFactory.CreateClient();

    var response = await client.GetAsync("/api/daily-report/2026-07-03/alice");

    response.EnsureSuccessStatusCode();
    var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
    Assert.True(payload.GetProperty("items").GetArrayLength() > 0);
}
```

- [ ] **Step 5: Run the integration tests and confirm the existing API remains stable**

Run:

```powershell
dotnet test backend/tests/Integration/Redmine.Tests.Integration.csproj
```

Expected:
- all feature tests pass
- 400 and 404 behaviors remain unchanged
- dashboard, daily report, weekly report, my task, and log time still reflect the old functional contract

- [ ] **Step 6: Commit the contract baseline**

```powershell
git add backend/tests/Integration
git commit -m "test: lock backend functional parity"
```

### Task 2: Add unit coverage for validators and handlers

**Files:**
- Modify: `backend/tests/Unit/Redmine.Tests.Unit.csproj`
- Create: `backend/tests/Unit/Features/Dashboard/GetDashboardUseCaseTests.cs`
- Create: `backend/tests/Unit/Features/DailyReport/GetDailyReportUseCaseTests.cs`
- Create: `backend/tests/Unit/Features/WeeklyReport/GetWeeklyReportUseCaseTests.cs`
- Create: `backend/tests/Unit/Features/MyTask/GetMyTaskUseCaseTests.cs`
- Create: `backend/tests/Unit/Features/LogTime/GetLogTimeUseCaseTests.cs`

- [ ] **Step 1: Confirm the unit test project references the application and domain layers**

```xml
<ItemGroup>
  <ProjectReference Include="..\..\redmine\Application\Redmine.Application.csproj" />
  <ProjectReference Include="..\..\redmine\Domain\Redmine.Domain.csproj" />
</ItemGroup>
```

- [ ] **Step 2: Add handler tests that verify success and not-found branches**

```csharp
using Redmine.Application.Features.Dashboard.Queries.GetDashboard;
using Redmine.Application.Features.Dashboard.Services;
using Redmine.Domain.Dashboard;

public sealed class GetDashboardUseCaseTests
{
    [Fact]
    public async Task Handle_returns_summary_when_reader_has_data()
    {
        var reader = new FakeDashboardReader();
        var handler = new GetDashboardHandler(reader, new GetDashboardQueryValidator());

        var result = await handler.Handle(new GetDashboardQuery("alice", "2026-07-03"), CancellationToken.None);

        Assert.True(result.IsT0);
        Assert.Equal("alice", result.AsT0.UserName);
    }
}
```

- [ ] **Step 3: Add validator tests only for required-field validation**

```csharp
[Fact]
public void Validator_rejects_missing_user_name()
{
    var validator = new GetMyTaskQueryValidator();
    var result = validator.Validate(new GetMyTaskQuery(""));

    Assert.False(result.IsValid);
    Assert.Contains(result.Errors, error => error.PropertyName == "UserName");
}
```

- [ ] **Step 4: Keep malformed route or date-format behavior in API/integration tests, not validator tests**

```csharp
[Fact]
public async Task Daily_report_malformed_route_input_is_handled_by_controller_or_route_binding()
{
    using var client = TestHostFactory.CreateClient();

    var response = await client.GetAsync("/api/daily-report/not-a-date/alice");

    Assert.True(response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.NotFound);
}
```

- [ ] **Step 5: Run the unit test project**

Run:

```powershell
dotnet test backend/tests/Unit/Redmine.Tests.Unit.csproj
```

Expected:
- handler tests pass
- validator tests pass
- tests confirm the old feature contracts stay intact at the use-case boundary

- [ ] **Step 6: Commit the unit behavior baseline**

```powershell
git add backend/tests/Unit
git commit -m "test: cover backend use cases and validators"
```

### Task 3: Replace in-memory readers with one concrete Redmine data repository and feature adapters

**Files:**
- Modify: `backend/redmine/Api/appsettings.json`
- Modify: `backend/redmine/Api/appsettings.Development.json`
- Create: `backend/redmine/Infrastructure/Redmine/RedmineApiOptions.cs`
- Create: `backend/redmine/Infrastructure/Redmine/RedmineApiClient.cs`
- Create: `backend/redmine/Infrastructure/Redmine/RedmineIssueRepository.cs`
- Create: `backend/redmine/Infrastructure/Redmine/RedmineIssueQuery.cs`
- Create: `backend/redmine/Infrastructure/Features/Dashboard/DashboardReader.cs`
- Create: `backend/redmine/Infrastructure/Features/DailyReport/DailyReportReader.cs`
- Create: `backend/redmine/Infrastructure/Features/WeeklyReport/WeeklyReportReader.cs`
- Create: `backend/redmine/Infrastructure/Features/MyTask/MyTaskReader.cs`
- Create: `backend/redmine/Infrastructure/Features/LogTime/LogTimeReader.cs`
- Modify: `backend/redmine/Api/Extensions/ServiceCollectionExtensions.cs`
- Delete: `backend/redmine/Services/Dashboard/InMemoryDashboardReader.cs`
- Delete: `backend/redmine/Services/DailyReport/InMemoryDailyReportReader.cs`
- Delete: `backend/redmine/Services/WeeklyReport/InMemoryWeeklyReportReader.cs`
- Delete: `backend/redmine/Services/MyTask/InMemoryMyTaskReader.cs`
- Delete: `backend/redmine/Services/LogTime/InMemoryLogTimeReader.cs`

- [ ] **Step 1: Introduce one repository abstraction over Redmine data instead of separate snapshot-source placeholders**

```csharp
public interface IRedmineIssueRepository
{
    Task<IReadOnlyList<RedmineIssue>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken);
}
```

- [ ] **Step 1b: Add Redmine API settings with explicit placeholders for URL and key**

```json
{
  "Redmine": {
    "BaseUrl": "https://redmine.wdm.co.jp/",
    "ApiKey": "REPLACE_ME"
  }
}
```

- [ ] **Step 2: Build feature readers as thin adapters over the shared repository**

```csharp
public sealed class DashboardReader : IDashboardReader
{
    private readonly IRedmineIssueRepository _repository;

    public DashboardReader(IRedmineIssueRepository repository)
    {
        _repository = repository;
    }

    public Task<DashboardSummary?> GetForUserAsync(string userName, string reportDate, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }
}
```

- [ ] **Step 3: Wire the repository and readers in DI**

```csharp
services.AddScoped<IRedmineIssueRepository, RedmineIssueRepository>();
services.AddScoped<IDashboardReader, DashboardReader>();
services.AddScoped<IDailyReportReader, DailyReportReader>();
services.AddScoped<IWeeklyReportReader, WeeklyReportReader>();
services.AddScoped<IMyTaskReader, MyTaskReader>();
services.AddScoped<ILogTimeReader, LogTimeReader>();
```

- [ ] **Step 4: Implement feature-specific transformations so old rules survive**

```csharp
// DashboardReader groups by the old status IDs.
// DailyReportReader groups by assignee and preserves the Other bucket.
// WeeklyReportReader splits previous/current week and supports export selection.
// MyTaskReader excludes the old cancelled/on-hold/done statuses.
// LogTimeReader preserves logged-user filtering and time-entry detail rows.
```

- [ ] **Step 4b: If the Redmine API cannot provide all required data with acceptable latency or stability, introduce PostgreSQL as an optional cache/persistence layer instead of expanding the feature readers further**

```markdown
PostgreSQL is optional in phase 1.
Use it only if Redmine API access is too slow, unreliable, or incomplete for the required views.
If introduced, keep the Redmine API as the source of truth and PostgreSQL as a cache or projection store.
```

- [ ] **Step 5: Run the full backend test suite**

Run:

```powershell
dotnet test backend/RedmineNextPlatform.sln
```

Expected:
- unit tests pass
- integration tests pass
- no visible contract changes for the frontend
- the old functional contract still holds

- [ ] **Step 6: Commit the infrastructure replacement**

```powershell
git add backend/redmine/Infrastructure backend/redmine/Api/Extensions/ServiceCollectionExtensions.cs backend/redmine/Services
git commit -m "feat: replace in-memory backend readers"
```

### Task 4: Add error-handling coverage that matches controller behavior

**Files:**
- Create: `backend/tests/Integration/Features/ApiErrorHandlingTests.cs`

- [ ] **Step 1: Verify not-found behavior for unknown but well-formed requests**

```csharp
[Fact]
public async Task Daily_report_returns_not_found_when_user_has_no_data()
{
    using var client = TestHostFactory.CreateClient();

    var response = await client.GetAsync("/api/daily-report/2026-07-03/unknown-user");

    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
}
```

- [ ] **Step 2: Verify validation error envelopes for empty required fields at the API boundary**

```csharp
[Fact]
public async Task My_task_returns_bad_request_for_missing_user_name()
{
    using var client = TestHostFactory.CreateClient();

    var response = await client.GetAsync("/api/my-task/");

    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
}
```

- [ ] **Step 3: Make malformed route behavior explicit in tests, without overloading FluentValidation**

```csharp
[Fact]
public async Task Malformed_route_input_has_an_explicit_controller_or_route_result()
{
    using var client = TestHostFactory.CreateClient();

    var response = await client.GetAsync("/api/daily-report/not-a-date/alice");

    Assert.True(response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.NotFound);
}
```

- [ ] **Step 4: Run the integration tests and confirm errors stay predictable**

Run:

```powershell
dotnet test backend/tests/Integration/Redmine.Tests.Integration.csproj
```

Expected:
- 400 response bodies include the same error envelope shape
- 404 responses remain unchanged
- route and validation behavior are explicit and stable

- [ ] **Step 5: Commit the error contract coverage**

```powershell
git add backend/tests/Integration
git commit -m "test: stabilize backend error contracts"
```

### Task 5: Document the backend boundary so future changes stay aligned with my-redmine

**Files:**
- Modify: `backend/redmine/README.md`
- Modify: `backend/redmine/Application/README.md`
- Modify: `backend/redmine/Infrastructure/README.md`
- Modify: `backend/redmine/Services/README.md`

- [ ] **Step 1: Document the production data path and feature ownership boundaries**

```markdown
- Application defines the feature contracts and use cases.
- Infrastructure owns Redmine data access and external integration.
- Services is reserved for cross-cutting workflows only.
- Redmine connection settings live in `backend/redmine/Api/appsettings.json` and `appsettings.Development.json` as placeholders when needed.
```

- [ ] **Step 2: Document the hard parity rules that must never regress**

```markdown
- Preserve dashboard status grouping, daily report grouping, weekly report split, my-task exclusions, and log-time filtering exactly as in my-redmine.
- Keep API contracts stable for frontend consumers.
- Add new capabilities only if they do not change existing behavior by default.
- Prefer PostgreSQL only for later persistence or caching if the external Redmine API becomes insufficient.
```

- [ ] **Step 3: Document the next backend backlog in a way that does not drift the product**

```markdown
- Add repository-backed persistence
- Replace remaining placeholder data sources
- Add auth and user context
- Introduce paging/filtering for issue-heavy endpoints
```

- [ ] **Step 4: Run a final solution-level test pass**

Run:

```powershell
dotnet test backend/RedmineNextPlatform.sln
```

Expected:
- green build across solution
- no contract drift

- [ ] **Step 5: Commit the backend readiness docs**

```powershell
git add backend/redmine/README.md backend/redmine/Application/README.md backend/redmine/Infrastructure/README.md backend/redmine/Services/README.md
git commit -m "docs: clarify backend readiness boundaries"
```
