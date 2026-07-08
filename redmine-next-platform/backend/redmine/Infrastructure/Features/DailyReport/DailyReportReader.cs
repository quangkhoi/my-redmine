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
        if (!_userDirectory.TryResolveUserId(userName, out _))
        {
            return null;
        }

        if (!LegacyRedmineRules.TryParseDate(reportDate, out var reportDay))
        {
            return null;
        }

        var day = LegacyRedmineRules.FormatDate(reportDay);
        var todayIssues = await FetchIssuesForAssigneesAsync(
            LegacyRedmineRules.DailyReportAssigneeIds,
            new RedmineIssueQuery
            {
                StatusId = "*",
                StartDate = $"><{day}|{day}",
                Sort = "start_date:asc,due_date:asc,id:asc"
            },
            cancellationToken);
        var processingIssues = await FetchIssuesForAssigneesAsync(
            LegacyRedmineRules.DailyReportAssigneeIds,
            new RedmineIssueQuery
            {
                StatusId = LegacyRedmineRules.ProcessingStatusId,
                Sort = "start_date:asc,due_date:asc,id:asc"
            },
            cancellationToken);
        var otherIssues = await FetchIssuesForAssigneesAsync(
            [LegacyRedmineRules.DailyReportOtherAssigneeId],
            new RedmineIssueQuery
            {
                StatusId = "*",
                StartDate = $"<={day}",
                Sort = "start_date:asc,due_date:asc,id:asc"
            },
            cancellationToken);

        var mergedIssues = LegacyRedmineRules.SortIssues(LegacyRedmineRules.UniqueIssues(
            todayIssues.Where(issue => issue.AssignedTo?.Id != LegacyRedmineRules.DailyReportOtherAssigneeId)
                .Concat(processingIssues.Where(issue => issue.DoneRatio <= 90))
                .Concat(otherIssues.Where(issue =>
                    issue.AssignedTo?.Id == LegacyRedmineRules.DailyReportOtherAssigneeId &&
                    LegacyRedmineRules.IsDevelopmentIssue(issue) &&
                    LegacyRedmineRules.DateLte(issue.StartDate, reportDay) &&
                    issue.Status?.Name is "処理中" or "未対応"))));

        var groups = LegacyRedmineRules.DailyReportAssigneeIds
            .Select(assigneeId => new DailyReportGroup(
                assigneeId.ToString(),
                LegacyRedmineRules.GetAssigneeLabel(assigneeId),
                assigneeId,
                LegacyRedmineRules.SortIssues(mergedIssues.Where(issue => issue.AssignedTo?.Id == assigneeId))
                    .Select(ToItem)
                    .ToList()))
            .ToList();

        var other = new DailyReportGroup(
            "other",
            "Other",
            LegacyRedmineRules.DailyReportOtherAssigneeId,
            LegacyRedmineRules.SortIssues(mergedIssues.Where(issue =>
                    issue.AssignedTo?.Id == LegacyRedmineRules.DailyReportOtherAssigneeId &&
                    LegacyRedmineRules.IsDevelopmentIssue(issue)))
                .Select(ToItem)
                .ToList());

        return new DailyReportSummary(reportDate, userName, groups, other);
    }

    private async Task<IReadOnlyList<RedmineIssueDto>> FetchIssuesForAssigneesAsync(
        IReadOnlyList<int> assigneeIds,
        RedmineIssueQuery baseQuery,
        CancellationToken cancellationToken)
    {
        var issueSets = await Task.WhenAll(assigneeIds.Select(assigneeId => _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            StatusId = baseQuery.StatusId,
            AssignedToId = assigneeId,
            StartDate = baseQuery.StartDate,
            DueDate = baseQuery.DueDate,
            UpdatedOn = baseQuery.UpdatedOn,
            SpentOn = baseQuery.SpentOn,
            Sort = baseQuery.Sort
        }, cancellationToken)));

        return issueSets.SelectMany(set => set).ToList();
    }

    private static DailyReportItem ToItem(RedmineIssueDto issue)
        => new(
            issue.Id,
            $"#{issue.Id}",
            issue.Subject,
            issue.Status?.Name ?? string.Empty,
            LegacyRedmineRules.GetTrackerName(issue),
            issue.StartDate,
            issue.DueDate);
}
