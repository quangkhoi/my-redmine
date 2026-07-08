namespace Redmine.Domain.Dashboard;

public sealed record DashboardIssueList(
    string Name,
    IReadOnlyList<DashboardIssue> Issues);
