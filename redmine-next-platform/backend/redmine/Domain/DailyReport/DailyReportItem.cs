namespace Redmine.Domain.DailyReport;

public sealed record DailyReportItem(string IssueKey, string Subject, string Status, int HoursSpent);
