using Redmine.Application.Features.WeeklyReport.Services;
using Redmine.Domain.WeeklyReport;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.WeeklyReport;

public sealed class WeeklyReportReader : IWeeklyReportReader
{
    private readonly IRedmineIssueRepository _repository;

    public WeeklyReportReader(IRedmineIssueRepository repository)
    {
        _repository = repository;
    }

    public async Task<WeeklyReportSummary?> GetForUserAsync(string weekStart, string userName, CancellationToken cancellationToken)
    {
        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            UpdatedOn = weekStart
        }, cancellationToken);

        if (issues.Count == 0)
        {
            return null;
        }

        return new WeeklyReportSummary(
            weekStart,
            weekStart,
            userName,
            issues.Select((issue, index) => new WeeklyReportItem($"RM-{issue.Id}", issue.Subject, issue.Status?.Name ?? "Open", "Mon", index + 1)).ToList());
    }
}
