namespace Redmine.Api.Contracts.WeeklyReport;

public sealed record GetWeeklyReportResponseContract(
    string UserName,
    bool HasPrevious,
    GetWeeklyReportRangeResponseContract Range,
    GetWeeklyReportRangeResponseContract ExportRange,
    IReadOnlyList<GetWeeklyReportItemResponseContract> PrevCsharp,
    IReadOnlyList<GetWeeklyReportItemResponseContract> PrevWeb,
    IReadOnlyList<GetWeeklyReportItemResponseContract> CurrentCsharp,
    IReadOnlyList<GetWeeklyReportItemResponseContract> CurrentWeb);

public sealed record GetWeeklyReportRangeResponseContract(string From, string To);

public sealed record GetWeeklyReportItemResponseContract(
    int IssueId,
    string IssueKey,
    string ProjectName,
    string Subject,
    string Status,
    string TrackerName,
    string? StartDate,
    string? DueDate,
    decimal ReportSpentHours);
