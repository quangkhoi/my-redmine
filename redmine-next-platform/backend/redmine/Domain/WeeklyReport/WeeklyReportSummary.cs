namespace Redmine.Domain.WeeklyReport;

public sealed record WeeklyReportSummary(
    string WeekStart,
    string WeekEnd,
    string UserName,
    IReadOnlyList<WeeklyReportItem> Items);
