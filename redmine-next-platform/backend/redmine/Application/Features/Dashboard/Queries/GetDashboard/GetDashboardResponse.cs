namespace Redmine.Application.Features.Dashboard.Queries.GetDashboard;

public sealed record GetDashboardResponse(string UserName, string ReportDate, IReadOnlyList<GetDashboardMetricResponse> Metrics);

public sealed record GetDashboardMetricResponse(string Code, string Label, int Value);
