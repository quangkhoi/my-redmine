using Redmine.Application.Features.DailyReport.Services;
using Redmine.Domain.DailyReport;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.DailyReport;

public sealed class DailyReportReader : IDailyReportReader
{
    private readonly IRedmineIssueRepository _repository;

    public DailyReportReader(IRedmineIssueRepository repository)
    {
        _repository = repository;
    }

    public async Task<DailyReportSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
    {
        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            UpdatedOn = reportDate
        }, cancellationToken);

        if (issues.Count == 0)
        {
            return null;
        }

        var items = issues
            .Select((issue, index) => new DailyReportItem($"RM-{issue.Id}", issue.Subject, issue.Status?.Name ?? "Open", index + 1))
            .ToList();

        return new DailyReportSummary(reportDate, userName, items);
    }
}
