using Redmine.Application.Features.LogTime.Services;
using Redmine.Domain.LogTime;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.LogTime;

public sealed class LogTimeReader : ILogTimeReader
{
    private readonly IRedmineIssueRepository _repository;
    private readonly IRedmineUserDirectory _userDirectory;

    public LogTimeReader(IRedmineIssueRepository repository, IRedmineUserDirectory userDirectory)
    {
        _repository = repository;
        _userDirectory = userDirectory;
    }

    public async Task<LogTimeSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
    {
        if (!_userDirectory.TryResolveUserId(userName, out var userId))
        {
            return null;
        }

        if (!LegacyRedmineRules.TryParseDate(reportDate, out var reportDay))
        {
            return null;
        }

        var monthStart = new DateOnly(reportDay.Year, reportDay.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        // Parallel: fetch issues and time entries simultaneously
        var issuesTask = _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            StatusId = "*",
            AssignedToId = userId,
            StartDate = $"<={LegacyRedmineRules.FormatDate(monthEnd)}",
            DueDate = $">={LegacyRedmineRules.FormatDate(monthStart)}",
            Sort = "start_date:asc,due_date:asc,id:asc"
        }, cancellationToken);

        var entriesTask = _repository.GetTimeEntriesAsync(new RedmineTimeEntryQuery
        {
            From = LegacyRedmineRules.FormatDate(monthStart),
            To = LegacyRedmineRules.FormatDate(monthEnd)
        }, cancellationToken);

        await Task.WhenAll(issuesTask, entriesTask);

        var issues = await issuesTask;
        var entries = await entriesTask;
        var filteredIssues = LegacyRedmineRules.SortIssues(issues.Where(LegacyRedmineRules.IsLoginTimeIssue)).ToList();

        var issueIds = filteredIssues.Select(issue => issue.Id).ToHashSet();
        var hoursByIssueId = new Dictionary<int, decimal>();

        foreach (var entry in LegacyRedmineRules.SortTimeEntries(entries))
        {
            var issueId = entry.Issue?.Id;
            if (!issueId.HasValue || !issueIds.Contains(issueId.Value))
            {
                continue;
            }

            hoursByIssueId[issueId.Value] = hoursByIssueId.GetValueOrDefault(issueId.Value) + entry.Hours;
        }

        return new LogTimeSummary(
            userName,
            userName,
            reportDate,
            filteredIssues.Select(issue => new LogTimeItem(
                issue.Id,
                $"#{issue.Id}",
                issue.Subject,
                issue.Status?.Name ?? string.Empty,
                hoursByIssueId.GetValueOrDefault(issue.Id),
                issue.AssignedTo?.Name,
                issue.StartDate,
                issue.DueDate)).ToList());
    }
}
