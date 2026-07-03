namespace Redmine.Domain.DailyReport;

public sealed record DailyReportSummary(string ReportDate, string UserName, IReadOnlyList<DailyReportItem> Items);
