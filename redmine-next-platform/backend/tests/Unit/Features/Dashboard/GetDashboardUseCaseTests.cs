using Redmine.Application.Features.Dashboard.Queries.GetDashboard;
using Redmine.Application.Features.Dashboard.Services;
using Redmine.Domain.Dashboard;

namespace Redmine.Tests.Unit.Features.Dashboard;

public sealed class GetDashboardUseCaseTests
{
    [Fact]
    public async Task Handle_ReturnsSummaryWhenReaderFindsData()
    {
        var reader = new FakeDashboardReader();
        var handler = new GetDashboardHandler(reader, new GetDashboardQueryValidator());

        var result = await handler.Handle(new GetDashboardQuery("alice", "2026-07-03"), CancellationToken.None);

        Assert.True(result.IsT0);
        Assert.Equal("alice", result.AsT0.UserName);
        Assert.Equal(2, result.AsT0.Metrics.Count);
    }

    private sealed class FakeDashboardReader : IDashboardReader
    {
        public Task<DashboardSummary?> GetForUserAsync(string userName, string reportDate, CancellationToken cancellationToken)
        {
            DashboardSummary? summary = userName == "alice" && reportDate == "2026-07-03"
                ? new DashboardSummary(
                    "alice",
                    "2026-07-03",
                    [
                        new DashboardMetric("open_issues", "Open issues", 7),
                        new DashboardMetric("hours_logged", "Hours logged", 5)
                    ])
                : null;

            return Task.FromResult(summary);
        }
    }
}
