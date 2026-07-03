using Redmine.Application.Features.Dashboard.Queries.GetDashboard;
using Riok.Mapperly.Abstractions;

namespace Redmine.Api.Contracts.Dashboard;

[Mapper]
public static partial class DashboardContractMapper
{
    public static partial GetDashboardResponseContract ToContract(GetDashboardResponse response);
    public static partial GetDashboardMetricResponseContract ToContract(GetDashboardMetricResponse response);
}
