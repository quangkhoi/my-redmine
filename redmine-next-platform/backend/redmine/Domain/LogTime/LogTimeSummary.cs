namespace Redmine.Domain.LogTime;

public sealed record LogTimeSummary(
    string UserName,
    string DisplayName,
    string ReportDate,
    IReadOnlyList<LogTimeItem> Items);
