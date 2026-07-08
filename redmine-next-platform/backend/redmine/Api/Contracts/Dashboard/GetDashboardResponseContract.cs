namespace Redmine.Api.Contracts.Dashboard;

public sealed record GetDashboardResponseContract(string UserName, string ReportDate, IReadOnlyList<GetDashboardMetricResponseContract> Metrics);

public sealed record GetDashboardMetricResponseContract(string Code, string Label, int Value);
