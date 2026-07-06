using Redmine.Application.Features.DailyReport.Services;
using Redmine.Domain.DailyReport;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.DailyReport;

public sealed class DailyReportReader : IDailyReportReader
{
    private readonly IRedmineIssueRepository _repository;
    private readonly IRedmineUserDirectory _userDirectory;

    public DailyReportReader(IRedmineIssueRepository repository, IRedmineUserDirectory userDirectory)
    {
        _repository = repository;
        _userDirectory = userDirectory;
    }

    public async Task<DailyReportSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
    {
        if (!_userDirectory.TryResolveUserId(userName, out var userId))
        {
            return null;
        }

        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery(), cancellationToken);
        var entries = await _repository.GetTimeEntriesAsync(reportDate, userId, cancellationToken);

        var filteredIssues = issues
            .Where(issue => IsAssignedTo(issue, userId))
            .Where(issue => IsDailyReportIssue(issue, reportDate))
            .ToList();

        var items = entries.Count > 0
            ? entries.Select(entry => new DailyReportItem(
                entry.Issue?.Id is { } issueId ? $"RM-{issueId}" : $"TE-{entry.Id}",
                entry.Issue?.Subject ?? entry.Comments ?? "Time entry",
                "Logged",
                ToWholeHours(entry.Hours))).ToList()
            : filteredIssues.Select((issue, index) => new DailyReportItem($"RM-{issue.Id}", issue.Subject, issue.Status?.Name ?? "Open", index + 1)).ToList();

        if (items.Count == 0)
        {
            return null;
        }

        return new DailyReportSummary(reportDate, userName, items);
    }

    private static bool IsAssignedTo(RedmineIssueDto issue, int userId)
        => issue.AssignedTo?.Id == userId;

    private static bool IsDailyReportIssue(RedmineIssueDto issue, string reportDate)
    {
        if (!string.IsNullOrWhiteSpace(issue.StartDate) && DateOnly.TryParse(issue.StartDate, out var startDate) && DateOnly.TryParse(reportDate, out var report))
        {
            return startDate <= report;
        }

        return issue.Tracker?.Name is "開発" or "Development" || issue.DoneRatio < 100;
    }

    private static int ToWholeHours(decimal hours)
        => Math.Max(1, (int)Math.Round(hours, MidpointRounding.AwayFromZero));
}
