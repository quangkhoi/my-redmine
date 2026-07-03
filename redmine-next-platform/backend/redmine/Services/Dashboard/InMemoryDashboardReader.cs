using Redmine.Application.Features.Dashboard.Services;
using Redmine.Domain.Dashboard;

namespace Redmine.Services.Dashboard;

public sealed class InMemoryDashboardReader : IDashboardReader
{
    public Task<DashboardSummary?> GetForUserAsync(string userName, string reportDate, CancellationToken cancellationToken)
    {
        DashboardSummary? summary = userName.ToLowerInvariant() == "alice" && reportDate == "2026-07-03"
            ? new DashboardSummary(
                "alice",
                "2026-07-03",
                [
                    new DashboardMetric("open_issues", "Open issues", 7),
                    new DashboardMetric("hours_logged", "Hours logged", 5),
                    new DashboardMetric("attention_items", "Attention items", 2)
                ])
            : null;

        return Task.FromResult(summary);
    }
}
