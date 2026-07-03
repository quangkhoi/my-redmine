namespace Redmine.Domain.Dashboard;

public sealed record DashboardSummary(string UserName, string ReportDate, IReadOnlyList<DashboardMetric> Metrics);
