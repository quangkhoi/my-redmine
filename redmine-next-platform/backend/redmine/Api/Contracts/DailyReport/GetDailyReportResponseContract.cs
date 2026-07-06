namespace Redmine.Api.Contracts.DailyReport;

public sealed record GetDailyReportResponseContract(
    string ReportDate,
    string UserName,
    IReadOnlyList<GetDailyReportGroupResponseContract> Groups,
    GetDailyReportGroupResponseContract Other);

public sealed record GetDailyReportGroupResponseContract(
    string Key,
    string Label,
    int? AssigneeId,
    IReadOnlyList<GetDailyReportItemResponseContract> Items);

public sealed record GetDailyReportItemResponseContract(
    int IssueId,
    string IssueKey,
    string Subject,
    string Status,
    string TrackerName,
    string? StartDate,
    string? DueDate);
