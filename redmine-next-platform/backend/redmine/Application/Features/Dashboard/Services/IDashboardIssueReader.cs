using Redmine.Domain.Dashboard;

namespace Redmine.Application.Features.Dashboard.Services;

public interface IDashboardIssueReader
{
    Task<DashboardIssueResult?> GetIssuesAsync(string startDate, string endDate, CancellationToken cancellationToken);
}
