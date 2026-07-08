using Redmine.Domain.Dashboard;

namespace Redmine.Application.Features.Dashboard.Services;

public interface IDashboardReader
{
    Task<DashboardSummary?> GetForUserAsync(string userName, string reportDate, CancellationToken cancellationToken);
}
