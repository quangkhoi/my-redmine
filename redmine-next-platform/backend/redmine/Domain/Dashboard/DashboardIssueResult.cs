namespace Redmine.Domain.Dashboard;

public sealed record DashboardIssueResult(
    DashboardIssueList Processing,
    DashboardIssueList NotStarted,
    DashboardIssueList Processed);
