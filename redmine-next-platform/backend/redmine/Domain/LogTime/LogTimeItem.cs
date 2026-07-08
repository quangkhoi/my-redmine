namespace Redmine.Domain.LogTime;

public sealed record LogTimeItem(
    int IssueId,
    string IssueKey,
    string Subject,
    string Status,
    decimal HoursLogged,
    string? AssigneeName,
    string? StartDate,
    string? DueDate);
