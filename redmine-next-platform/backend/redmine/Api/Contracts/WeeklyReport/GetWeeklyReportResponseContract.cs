namespace Redmine.Api.Contracts.WeeklyReport;

public sealed record GetWeeklyReportResponseContract(string WeekStart, string WeekEnd, string UserName, IReadOnlyList<GetWeeklyReportItemResponseContract> Items);

public sealed record GetWeeklyReportItemResponseContract(string IssueKey, string Subject, string Status, string Day, int HoursSpent);
