namespace Redmine.Domain.LogTime;

public sealed record LogTimeItem(
    string IssueKey,
    string Subject,
    string Status,
    decimal HoursLogged);
