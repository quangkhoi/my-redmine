namespace Redmine.Domain.WeeklyReport;

public sealed record WeeklyReportItem(
    string IssueKey,
    string Subject,
    string Status,
    string Day,
    int HoursSpent);
