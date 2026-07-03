namespace Redmine.Application.Features.DailyReport.Queries.GetDailyReport;

public sealed record GetDailyReportResponse(string ReportDate, string UserName, IReadOnlyList<GetDailyReportItemResponse> Items);

public sealed record GetDailyReportItemResponse(string IssueKey, string Subject, string Status, int HoursSpent);
