namespace Redmine.Domain.Dashboard;

public sealed record DashboardIssue(
    int Id,
    string Subject,
    string? ProjectName,
    string? TrackerName,
    string? StatusName,
    string? AssigneeName,
    string? StartDate,
    string? DueDate,
    int DoneRatio,
    decimal? SpentHours,
    string? ReleaseTarget);
