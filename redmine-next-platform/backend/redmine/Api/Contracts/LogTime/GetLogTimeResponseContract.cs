namespace Redmine.Api.Contracts.LogTime;

public sealed record GetLogTimeResponseContract(
    string UserName,
    string DisplayName,
    string ReportDate,
    IReadOnlyList<GetLogTimeItemResponseContract> Items);

public sealed record GetLogTimeItemResponseContract(
    int IssueId,
    string IssueKey,
    string Subject,
    string Status,
    decimal HoursLogged,
    string? AssigneeName,
    string? StartDate,
    string? DueDate);
