namespace Redmine.Application.Features.Dashboard.Queries.GetDashboardIssues;

public sealed record GetDashboardIssuesResponse(
    GetDashboardIssueListResponse Processing,
    GetDashboardIssueListResponse NotStarted,
    GetDashboardIssueListResponse Processed);

public sealed record GetDashboardIssueListResponse(
    string Name,
    IReadOnlyList<GetDashboardIssueResponse> Issues);

public sealed record GetDashboardIssueResponse(
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
