namespace Redmine.Api.Contracts.DashboardIssues;

public sealed record GetDashboardIssuesResponseContract(
    GetDashboardIssueListResponseContract Processing,
    GetDashboardIssueListResponseContract NotStarted,
    GetDashboardIssueListResponseContract Processed);

public sealed record GetDashboardIssueListResponseContract(
    string Name,
    IReadOnlyList<GetDashboardIssueResponseContract> Issues);

public sealed record GetDashboardIssueResponseContract(
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
