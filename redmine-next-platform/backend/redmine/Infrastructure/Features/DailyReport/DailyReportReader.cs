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
        var entries = await _repository.GetTimeEntriesAsync(reportDate, userName, cancellationToken);

        var items = entries.Count > 0
            ? entries.Select((entry, index) => new DailyReportItem(
                entry.Issue?.Id is { } issueId ? $"RM-{issueId}" : $"TE-{entry.Id}",
                entry.Issue?.Subject ?? entry.Comments ?? "Time entry",
                "Logged",
                (int)Math.Round(entry.Hours, MidpointRounding.AwayFromZero) > 0 ? (int)Math.Round(entry.Hours, MidpointRounding.AwayFromZero) : 1)).ToList()
            : issues.Select((issue, index) => new DailyReportItem($"RM-{issue.Id}", issue.Subject, issue.Status?.Name ?? "Open", index + 1)).ToList();

        if (items.Count == 0)
        {
            return null;
        }

        return new DailyReportSummary(reportDate, userName, items);
    }
}
