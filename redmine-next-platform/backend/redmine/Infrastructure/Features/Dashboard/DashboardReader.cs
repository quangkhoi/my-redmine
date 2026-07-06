using Redmine.Application.Features.Dashboard.Services;
using Redmine.Domain.Dashboard;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.Dashboard;

public sealed class DashboardReader : IDashboardReader
{
    private readonly IRedmineIssueRepository _repository;

    public DashboardReader(IRedmineIssueRepository repository)
    {
        _repository = repository;
    }

    public async Task<DashboardSummary?> GetForUserAsync(string userName, string reportDate, CancellationToken cancellationToken)
    {
        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            UpdatedOn = reportDate
        }, cancellationToken);

        if (issues.Count == 0)
        {
            return null;
        }

        var summary = new DashboardSummary(userName, reportDate, [
            new DashboardMetric("open_issues", "Open issues", issues.Count),
            new DashboardMetric("hours_logged", "Hours logged", 0),
            new DashboardMetric("attention_items", "Attention items", issues.Count > 0 ? 1 : 0)
        ]);

        return summary;
    }
}
