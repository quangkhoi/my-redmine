namespace Redmine.Domain.DailyReport;

public sealed record DailyReportSummary(
    string ReportDate,
    string UserName,
    IReadOnlyList<DailyReportGroup> Groups,
    DailyReportGroup Other);

public sealed record DailyReportGroup(
    string Key,
    string Label,
    int? AssigneeId,
    IReadOnlyList<DailyReportItem> Items);
