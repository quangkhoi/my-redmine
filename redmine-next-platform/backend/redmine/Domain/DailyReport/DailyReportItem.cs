namespace Redmine.Domain.DailyReport;

public sealed record DailyReportItem(
    int IssueId,
    string IssueKey,
    string Subject,
    string Status,
    string TrackerName,
    string? StartDate,
    string? DueDate);
