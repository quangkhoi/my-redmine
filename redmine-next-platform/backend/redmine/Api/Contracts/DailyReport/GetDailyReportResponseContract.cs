namespace Redmine.Api.Contracts.DailyReport;

public sealed record GetDailyReportResponseContract(string ReportDate, string UserName, IReadOnlyList<GetDailyReportItemResponseContract> Items);

public sealed record GetDailyReportItemResponseContract(string IssueKey, string Subject, string Status, int HoursSpent);
