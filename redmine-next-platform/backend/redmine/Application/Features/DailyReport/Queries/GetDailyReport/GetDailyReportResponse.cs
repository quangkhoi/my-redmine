namespace Redmine.Application.Features.DailyReport.Queries.GetDailyReport;

public sealed record GetDailyReportResponse(
    string ReportDate,
    string UserName,
    IReadOnlyList<GetDailyReportGroupResponse> Groups,
    GetDailyReportGroupResponse Other);

public sealed record GetDailyReportGroupResponse(
    string Key,
    string Label,
    int? AssigneeId,
    IReadOnlyList<GetDailyReportItemResponse> Items);

public sealed record GetDailyReportItemResponse(
    int IssueId,
    string IssueKey,
    string Subject,
    string Status,
    string TrackerName,
    string? ProjectName,
    string? StartDate,
    string? DueDate);
