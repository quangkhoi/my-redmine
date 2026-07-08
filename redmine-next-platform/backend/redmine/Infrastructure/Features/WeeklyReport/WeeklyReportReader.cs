using Redmine.Application.Features.WeeklyReport.Services;
using Redmine.Domain.WeeklyReport;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.WeeklyReport;

public sealed class WeeklyReportReader : IWeeklyReportReader
{
    private readonly IRedmineIssueRepository _repository;
    private readonly IRedmineUserDirectory _userDirectory;

    public WeeklyReportReader(IRedmineIssueRepository repository, IRedmineUserDirectory userDirectory)
    {
        _repository = repository;
        _userDirectory = userDirectory;
    }

    public async Task<WeeklyReportSummary?> GetForUserAsync(string weekStart, string userName, CancellationToken cancellationToken)
    {
        if (!_userDirectory.TryResolveUserId(userName, out var userId))
        {
            return null;
        }

        if (!LegacyRedmineRules.TryParseDate(weekStart, out var currentMonday))
        {
            return null;
        }

        var currentFriday = currentMonday.AddDays(4);
        var previousMonday = currentMonday.AddDays(-7);
        var previousFriday = currentMonday.AddDays(-3);

        var prevCsharp = await FetchReportListAsync(LegacyRedmineRules.WeeklyCsharpAssigneeIds, previousMonday, previousFriday, null, cancellationToken);
        var prevWeb = await FetchReportListAsync(LegacyRedmineRules.WeeklyWebAssigneeIds, previousMonday, previousFriday, null, cancellationToken);
        var currentWeb = await FetchReportListAsync(LegacyRedmineRules.WeeklyWebAssigneeIds, currentMonday, currentFriday, null, cancellationToken);
        var teamCurrentCsharp = await FetchReportListAsync(LegacyRedmineRules.WeeklyCsharpAssigneeIds, currentMonday, currentFriday, null, cancellationToken);
        var specialCurrentCsharp = await FetchReportListAsync(
            [LegacyRedmineRules.WeeklySpecialDevelopmentAssigneeId],
            currentMonday,
            currentFriday,
            LegacyRedmineRules.IsDevelopmentIssue,
            cancellationToken);

        var currentCsharp = LegacyRedmineRules
            .SortIssues(LegacyRedmineRules.UniqueIssues(teamCurrentCsharp.Concat(specialCurrentCsharp)))
            .Select(ToWeeklyItem)
            .ToList();

        return new WeeklyReportSummary(
            userName,
            true,
            new WeeklyReportRange(LegacyRedmineRules.FormatDate(previousMonday), LegacyRedmineRules.FormatDate(currentFriday)),
            new WeeklyReportRange(LegacyRedmineRules.FormatDate(previousMonday), LegacyRedmineRules.FormatDate(previousFriday)),
            prevCsharp.Select(ToWeeklyItem).ToList(),
            prevWeb.Select(ToWeeklyItem).ToList(),
            currentCsharp,
            currentWeb.Select(ToWeeklyItem).ToList());
    }

    private async Task<IReadOnlyList<RedmineIssueDto>> FetchReportListAsync(
        IReadOnlyList<int> assigneeIds,
        DateOnly rangeStart,
        DateOnly rangeEnd,
        Func<RedmineIssueDto, bool>? issueFilter,
        CancellationToken cancellationToken)
    {
        var issueSets = await Task.WhenAll(assigneeIds.Select(assigneeId => _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            StatusId = "*",
            AssignedToId = assigneeId,
            StartDate = $"<={LegacyRedmineRules.FormatDate(rangeEnd)}",
            DueDate = $">={LegacyRedmineRules.FormatDate(rangeStart)}",
            Sort = "start_date:asc,due_date:asc,id:asc"
        }, cancellationToken)));

        var issues = LegacyRedmineRules
            .SortIssues(LegacyRedmineRules.UniqueIssues(issueSets.SelectMany(set => set)))
            .Where(LegacyRedmineRules.IsWorkItemStatusIssue)
            .Where(issueFilter ?? (_ => true))
            .ToList();

        var issueIds = issues.Select(issue => issue.Id).ToHashSet();
        var spentHoursByIssueId = new Dictionary<int, decimal>();
        var entries = await _repository.GetTimeEntriesAsync(new RedmineTimeEntryQuery
        {
            From = LegacyRedmineRules.FormatDate(rangeStart),
            To = LegacyRedmineRules.FormatDate(rangeEnd)
        }, cancellationToken);

        foreach (var entry in LegacyRedmineRules.SortTimeEntries(entries))
        {
            var issueId = entry.Issue?.Id;
            if (!issueId.HasValue || !issueIds.Contains(issueId.Value))
            {
                continue;
            }

            spentHoursByIssueId[issueId.Value] = spentHoursByIssueId.GetValueOrDefault(issueId.Value) + entry.Hours;
        }

        return issues.Select(issue => issue with
        {
            SpentHours = spentHoursByIssueId.GetValueOrDefault(issue.Id)
        }).ToList();
    }

    private static WeeklyReportItem ToWeeklyItem(RedmineIssueDto issue)
        => new(
            issue.Id,
            $"#{issue.Id}",
            issue.Project?.Name ?? string.Empty,
            issue.Subject,
            issue.Status?.Name ?? string.Empty,
            LegacyRedmineRules.GetTrackerName(issue),
            issue.StartDate,
            issue.DueDate,
            issue.SpentHours ?? 0m);
}
