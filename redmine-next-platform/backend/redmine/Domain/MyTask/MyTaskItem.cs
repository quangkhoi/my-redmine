namespace Redmine.Domain.MyTask;

public sealed record MyTaskItem(
    string IssueKey,
    string Subject,
    string Status,
    string? ProjectName,
    string? StartDate,
    string? DueDate,
    int DoneRatio,
    string? TrackerName);
