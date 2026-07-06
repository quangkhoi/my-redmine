namespace Redmine.Infrastructure.Redmine;

internal static class LegacyRedmineRules
{
    public const string NotStartedStatusId = "1";
    public const string ProcessingStatusId = "2";
    public const string ProcessedStatusId = "3";

    public static readonly int[] WeeklyCsharpAssigneeIds = [106, 94, 99];
    public static readonly int[] WeeklyWebAssigneeIds = [123];
    public const int WeeklySpecialDevelopmentAssigneeId = 114;

    public static readonly int[] DailyReportAssigneeIds = [94, 99, 106, 123];
    public const int DailyReportOtherAssigneeId = 114;

    private static readonly HashSet<string> WorkItemStatusNames = new(
        ["未対応", "処理中", "処理済み", "完了"],
        StringComparer.Ordinal);

    private static readonly HashSet<string> MyTaskExcludedStatusNames = new(
        ["完了", "完了（中止）", "完了（保留）"],
        StringComparer.Ordinal);

    public static bool IsWorkItemStatusIssue(RedmineIssueDto issue)
        => WorkItemStatusNames.Contains((issue.Status?.Name ?? string.Empty).Trim());

    public static bool IsLoginTimeIssue(RedmineIssueDto issue)
        => IsWorkItemStatusIssue(issue) && issue.DoneRatio > 0;

    public static bool IsMyTaskIssue(RedmineIssueDto issue)
        => !MyTaskExcludedStatusNames.Contains((issue.Status?.Name ?? string.Empty).Trim());

    public static bool IsDevelopmentIssue(RedmineIssueDto issue)
        => string.Equals(GetTrackerName(issue), "開発", StringComparison.Ordinal);

    public static string GetTrackerName(RedmineIssueDto issue)
        => (issue.Tracker?.Name ?? string.Empty).Trim();

    public static string GetAssigneeLabel(int assigneeId)
        => assigneeId switch
        {
            94 => "Nam",
            99 => "Tuyen",
            106 => "Duy",
            113 => "Anh",
            114 => "Khoi",
            123 => "Phi",
            _ => assigneeId.ToString()
        };

    public static IReadOnlyList<RedmineIssueDto> UniqueIssues(IEnumerable<RedmineIssueDto> issues)
        => issues
            .GroupBy(issue => issue.Id)
            .Select(group => group.First())
            .ToList();

    public static IReadOnlyList<RedmineIssueDto> SortIssues(IEnumerable<RedmineIssueDto> issues)
        => issues
            .OrderBy(issue => ParseSortableDate(issue.StartDate))
            .ThenBy(issue => ParseSortableDate(issue.DueDate))
            .ThenBy(issue => issue.Id)
            .ToList();

    public static IReadOnlyList<RedmineTimeEntryDto> SortTimeEntries(IEnumerable<RedmineTimeEntryDto> entries)
        => entries
            .OrderBy(entry => ParseSortableDate(entry.SpentOn))
            .ThenBy(entry => entry.User?.Name ?? string.Empty, StringComparer.Ordinal)
            .ThenBy(entry => entry.Id)
            .ToList();

    public static bool DateGte(string? value, DateOnly targetDate)
        => TryParseDate(value, out var parsed) && parsed >= targetDate;

    public static bool DateLte(string? value, DateOnly targetDate)
        => TryParseDate(value, out var parsed) && parsed <= targetDate;

    public static bool TryParseDate(string? value, out DateOnly date)
        => DateOnly.TryParse(value, out date);

    public static string FormatDate(DateOnly value)
        => value.ToString("yyyy-MM-dd");

    private static DateOnly ParseSortableDate(string? value)
        => TryParseDate(value, out var parsed) ? parsed : DateOnly.MaxValue;
}
