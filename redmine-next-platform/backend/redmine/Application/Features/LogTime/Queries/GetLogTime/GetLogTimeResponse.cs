namespace Redmine.Application.Features.LogTime.Queries.GetLogTime;

public sealed record GetLogTimeResponse(
    string UserName,
    string DisplayName,
    string ReportDate,
    IReadOnlyList<GetLogTimeItemResponse> Items);

public sealed record GetLogTimeItemResponse(
    int IssueId,
    string IssueKey,
    string Subject,
    string Status,
    decimal HoursLogged,
    string? AssigneeName,
    string? StartDate,
    string? DueDate);
