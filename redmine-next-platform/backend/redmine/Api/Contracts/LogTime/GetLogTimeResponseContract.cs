namespace Redmine.Api.Contracts.LogTime;

public sealed record GetLogTimeResponseContract(
    string UserName,
    string DisplayName,
    string ReportDate,
    IReadOnlyList<GetLogTimeItemResponseContract> Items);

public sealed record GetLogTimeItemResponseContract(string IssueKey, string Subject, string Status, decimal HoursLogged);
