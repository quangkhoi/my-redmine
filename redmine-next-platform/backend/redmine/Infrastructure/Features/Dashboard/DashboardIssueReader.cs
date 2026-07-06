using Redmine.Application.Features.Dashboard.Services;
using Redmine.Domain.Dashboard;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.Dashboard;

public sealed class DashboardIssueReader : IDashboardIssueReader
{
    private readonly IRedmineIssueRepository _repository;
    private readonly IRedmineReferenceDataRepository _referenceDataRepository;
    private readonly IRedmineUserDirectory _userDirectory;

    private static readonly HashSet<int> DashboardAssigneeIds = [94, 99, 106, 113, 114, 123];

    public DashboardIssueReader(
        IRedmineIssueRepository repository,
        IRedmineReferenceDataRepository referenceDataRepository,
        IRedmineUserDirectory userDirectory)
    {
        _repository = repository;
        _referenceDataRepository = referenceDataRepository;
        _userDirectory = userDirectory;
    }

    public async Task<DashboardIssueResult?> GetIssuesAsync(string startDate, string endDate, CancellationToken cancellationToken)
    {
        var statuses = await _referenceDataRepository.GetIssueStatusesAsync(cancellationToken);
        var customFields = await _referenceDataRepository.GetCustomFieldsAsync(cancellationToken);

        var processingStatusId = FindStatusId(statuses, "処理中", "In Progress");
        var notStartedStatusId = FindStatusId(statuses, "未対応", "Not Started");
        var processedStatusId = FindStatusId(statuses, "処理済み", "Processed");

        if (processingStatusId is null || notStartedStatusId is null || processedStatusId is null)
        {
            return null;
        }

        var releaseTargetField = customFields.FirstOrDefault(f => f.Name is "リリース対象" or "Release Target");
        var releaseTargetValueNames = BuildReleaseTargetValueNames(releaseTargetField);

        var processingIssues = await FetchIssuesForAssignees(
            processingStatusId.Value, null, null, null, cancellationToken);

        var notStartedIssues = await FetchIssuesForAssignees(
            notStartedStatusId.Value, null, startDate, endDate, cancellationToken);

        var processedIssuesRaw = await FetchIssuesForAssignees(
            processedStatusId.Value, null, null, null, cancellationToken);
        var completedProcessingIssues = await FetchIssuesForAssignees(
            processingStatusId.Value, null, null, null, cancellationToken);

        var processing = processingIssues
            .Where(i => i.DoneRatio < 100)
            .Select(i => MapIssue(i, releaseTargetValueNames))
            .ToList();
        SortIssuesAscending(processing);

        var notStarted = notStartedIssues
            .Select(i => MapIssue(i, releaseTargetValueNames))
            .ToList();
        SortNotStartedIssues(notStarted);

        var processed = processedIssuesRaw
            .Where(i => i.DoneRatio == 90)
            .Concat(completedProcessingIssues.Where(i => i.DoneRatio == 100))
            .GroupBy(i => i.Id)
            .Select(g => g.First())
            .Select(i => MapIssue(i, releaseTargetValueNames))
            .ToList();
        SortIssuesDescending(processed);

        return new DashboardIssueResult(
            new DashboardIssueList("processing", processing),
            new DashboardIssueList("notStarted", notStarted),
            new DashboardIssueList("processed", processed));
    }

    private async Task<IReadOnlyList<RedmineIssueDto>> FetchIssuesForAssignees(
        int statusId,
        int? assigneeId,
        string? startDateFrom,
        string? startDateTo,
        CancellationToken cancellationToken)
    {
        var allIssues = new List<RedmineIssueDto>();

        foreach (var userId in DashboardAssigneeIds)
        {
            string? startFilter = null;
            if (startDateFrom is not null && startDateTo is not null)
            {
                startFilter = $"><{startDateFrom}|{startDateTo}";
            }
            else if (startDateFrom is not null)
            {
                startFilter = $">={startDateFrom}";
            }
            else if (startDateTo is not null)
            {
                startFilter = $"<={startDateTo}";
            }

            var query = new RedmineIssueQuery
            {
                StatusId = statusId.ToString(),
                AssignedToId = assigneeId ?? userId,
                Sort = "start_date:asc,due_date:asc,id:asc",
                StartDate = startFilter
            };

            var issues = await _repository.GetIssuesAsync(query, cancellationToken);
            allIssues.AddRange(issues.Where(i => i.AssignedTo?.Id == userId));
        }

        return allIssues.DistinctBy(i => i.Id).ToList();
    }

    private static DashboardIssue MapIssue(RedmineIssueDto issue, IReadOnlyDictionary<string, string> releaseTargetValueNames)
    {
        var releaseTargetValue = GetCustomFieldValue(issue, "リリース対象");
        var releaseTargetDisplay = releaseTargetValue is not null && releaseTargetValueNames.TryGetValue(releaseTargetValue, out var name)
            ? name
            : releaseTargetValue;

        return new DashboardIssue(
            issue.Id,
            issue.Subject,
            issue.Project?.Name,
            issue.Tracker?.Name,
            issue.Status?.Name,
            issue.AssignedTo?.Name,
            issue.StartDate,
            issue.DueDate,
            issue.DoneRatio,
            issue.SpentHours,
            releaseTargetDisplay);
    }

    private static string? GetCustomFieldValue(RedmineIssueDto issue, string fieldName)
    {
        if (issue.CustomFields is null)
        {
            return null;
        }

        var field = issue.CustomFields.FirstOrDefault(f =>
            string.Equals(f.Name, fieldName, StringComparison.OrdinalIgnoreCase));

        if (field is null)
        {
            return null;
        }

        return field.Value.ValueKind switch
        {
            System.Text.Json.JsonValueKind.String => field.Value.GetString(),
            System.Text.Json.JsonValueKind.Number => field.Value.GetRawText(),
            System.Text.Json.JsonValueKind.Array => field.Value.GetArrayLength() > 0 ? field.Value.GetRawText() : null,
            _ => null
        };
    }

    private static int? FindStatusId(IReadOnlyList<RedmineIssueStatusDto> statuses, params string[] candidates)
    {
        return statuses
            .FirstOrDefault(s => candidates.Any(c => string.Equals(s.Name, c, StringComparison.OrdinalIgnoreCase)))
            ?.Id;
    }

    private static void SortIssuesAscending(List<DashboardIssue> issues)
    {
        issues.Sort((a, b) =>
        {
            var startDiff = CompareDate(a.StartDate, b.StartDate);
            if (startDiff != 0) return startDiff;

            var dueDiff = CompareDate(a.DueDate, b.DueDate);
            if (dueDiff != 0) return dueDiff;

            return a.Id.CompareTo(b.Id);
        });
    }

    private static void SortNotStartedIssues(List<DashboardIssue> issues)
    {
        issues.Sort((a, b) =>
        {
            var trackerDiff = GetNotStartedTrackerRank(a) - GetNotStartedTrackerRank(b);
            if (trackerDiff != 0) return trackerDiff;

            var trackerNameDiff = string.Compare(a.TrackerName ?? "", b.TrackerName ?? "", StringComparison.OrdinalIgnoreCase);
            if (trackerNameDiff != 0) return trackerNameDiff;

            var startDiff = CompareDate(a.StartDate, b.StartDate);
            if (startDiff != 0) return startDiff;

            var dueDiff = CompareDate(a.DueDate, b.DueDate);
            if (dueDiff != 0) return dueDiff;

            return a.Id.CompareTo(b.Id);
        });
    }

    private static void SortIssuesDescending(List<DashboardIssue> issues)
    {
        issues.Sort((a, b) =>
        {
            var startDiff = CompareDate(b.StartDate, a.StartDate);
            if (startDiff != 0) return startDiff;

            var dueDiff = CompareDate(b.DueDate, a.DueDate);
            if (dueDiff != 0) return dueDiff;

            return b.Id.CompareTo(a.Id);
        });
    }

    private static int CompareDate(string? a, string? b)
    {
        if (string.IsNullOrEmpty(a) && string.IsNullOrEmpty(b)) return 0;
        if (string.IsNullOrEmpty(a)) return -1;
        if (string.IsNullOrEmpty(b)) return 1;
        return string.Compare(a, b, StringComparison.Ordinal);
    }

    private static int GetNotStartedTrackerRank(DashboardIssue issue)
    {
        return (issue.TrackerName ?? "") == "開発" ? 0 : 1;
    }

    private static IReadOnlyDictionary<string, string> BuildReleaseTargetValueNames(RedmineCustomFieldDto? field)
    {
        if (field?.PossibleValues is null)
        {
            return new Dictionary<string, string>();
        }

        var dict = new Dictionary<string, string>();
        foreach (var value in field.PossibleValues)
        {
            var key = value.Value ?? value.Name ?? value.Label;
            var name = value.Label ?? value.Name ?? value.Value;
            if (key is not null && name is not null)
            {
                dict[key] = name;
            }
        }
        return dict;
    }
}
