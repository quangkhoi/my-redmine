namespace Redmine.Application.Features.WeeklyReport.Queries.GetWeeklyReport;

public sealed record GetWeeklyReportResponse(string WeekStart, string WeekEnd, string UserName, IReadOnlyList<GetWeeklyReportItemResponse> Items);

public sealed record GetWeeklyReportItemResponse(string IssueKey, string Subject, string Status, string Day, int HoursSpent);
