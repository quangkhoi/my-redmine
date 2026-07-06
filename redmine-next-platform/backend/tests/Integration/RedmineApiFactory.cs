using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Redmine.Application.Features.Dashboard.Services;
using Redmine.Application.Features.DailyReport.Services;
using Redmine.Application.Features.LogTime.Services;
using Redmine.Application.Features.MyTask.Services;
using Redmine.Application.Features.WeeklyReport.Services;
using Redmine.Domain.Dashboard;
using Redmine.Domain.DailyReport;
using Redmine.Domain.LogTime;
using Redmine.Domain.MyTask;
using Redmine.Domain.WeeklyReport;

namespace Redmine.Tests.Integration;

public sealed class RedmineApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IDashboardReader>();
            services.RemoveAll<IDailyReportReader>();
            services.RemoveAll<IMyTaskReader>();
            services.RemoveAll<ILogTimeReader>();
            services.RemoveAll<IWeeklyReportReader>();

            services.AddSingleton<IDashboardReader>(new FakeDashboardReader());
            services.AddSingleton<IDailyReportReader>(new FakeDailyReportReader());
            services.AddSingleton<IMyTaskReader>(new FakeMyTaskReader());
            services.AddSingleton<ILogTimeReader>(new FakeLogTimeReader());
            services.AddSingleton<IWeeklyReportReader>(new FakeWeeklyReportReader());
        });
    }

    private sealed class FakeDashboardReader : IDashboardReader
    {
        public Task<DashboardSummary?> GetForUserAsync(string userName, string reportDate, CancellationToken cancellationToken)
            => Task.FromResult<DashboardSummary?>(new DashboardSummary(userName, reportDate, [
                new DashboardMetric("open_issues", "Open issues", 2),
                new DashboardMetric("hours_logged", "Hours logged", 8),
                new DashboardMetric("attention_items", "Attention items", 1)
            ]));
    }

    private sealed class FakeDailyReportReader : IDailyReportReader
    {
        public Task<DailyReportSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
            => Task.FromResult<DailyReportSummary?>(new DailyReportSummary(
                reportDate,
                userName,
                [
                    new DailyReportGroup(
                        "99",
                        "Tuyen",
                        99,
                        [
                            new DailyReportItem(1001, "RM-1001", "Fix login", "In Progress", "開発", reportDate, "2026-07-08")
                        ])
                ],
                new DailyReportGroup("other", "Other", 114, [])));
    }

    private sealed class FakeMyTaskReader : IMyTaskReader
    {
        public Task<MyTaskSummary?> GetForUserAsync(string userName, string? startDate, string? endDate, CancellationToken cancellationToken)
            => Task.FromResult<MyTaskSummary?>(new MyTaskSummary(userName, userName, [
                new MyTaskItem("RM-1001", "Fix login", "In Progress")
            ]));
    }

    private sealed class FakeLogTimeReader : ILogTimeReader
    {
        public Task<LogTimeSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
            => Task.FromResult<LogTimeSummary?>(new LogTimeSummary(userName, userName, reportDate, [
                new LogTimeItem("RM-1001", "Fix login", "Logged", 3.5m)
            ]));
    }

    private sealed class FakeWeeklyReportReader : IWeeklyReportReader
    {
        public Task<WeeklyReportSummary?> GetForUserAsync(string weekStart, string userName, CancellationToken cancellationToken)
            => Task.FromResult<WeeklyReportSummary?>(new WeeklyReportSummary(
                userName,
                true,
                new WeeklyReportRange("2026-06-29", "2026-07-10"),
                new WeeklyReportRange("2026-06-29", "2026-07-03"),
                [
                    new WeeklyReportItem(1001, "RM-1001", "Project", "Fix login", "In Progress", "開発", "2026-06-29", "2026-07-03", 3m)
                ],
                [],
                [],
                []));
    }
}
