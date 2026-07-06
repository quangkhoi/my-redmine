namespace Redmine.Application.Features.WeeklyReport.Queries.GetWeeklyReport;

public sealed record GetWeeklyReportResponse(
    string UserName,
    bool HasPrevious,
    GetWeeklyReportRangeResponse Range,
    GetWeeklyReportRangeResponse ExportRange,
    IReadOnlyList<GetWeeklyReportItemResponse> PrevCsharp,
    IReadOnlyList<GetWeeklyReportItemResponse> PrevWeb,
    IReadOnlyList<GetWeeklyReportItemResponse> CurrentCsharp,
    IReadOnlyList<GetWeeklyReportItemResponse> CurrentWeb);

public sealed record GetWeeklyReportRangeResponse(string From, string To);

public sealed record GetWeeklyReportItemResponse(
    int IssueId,
    string IssueKey,
    string ProjectName,
    string Subject,
    string Status,
    string TrackerName,
    string? StartDate,
    string? DueDate,
    decimal ReportSpentHours);
