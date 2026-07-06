namespace Redmine.Domain.WeeklyReport;

public sealed record WeeklyReportItem(
    int IssueId,
    string IssueKey,
    string ProjectName,
    string Subject,
    string Status,
    string TrackerName,
    string? StartDate,
    string? DueDate,
    decimal ReportSpentHours);
