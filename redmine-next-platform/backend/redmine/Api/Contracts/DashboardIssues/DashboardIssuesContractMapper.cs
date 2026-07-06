using Redmine.Application.Features.Dashboard.Queries.GetDashboardIssues;
using Riok.Mapperly.Abstractions;

namespace Redmine.Api.Contracts.DashboardIssues;

[Mapper]
public static partial class DashboardIssuesContractMapper
{
    public static partial GetDashboardIssuesResponseContract ToContract(GetDashboardIssuesResponse response);
    public static partial GetDashboardIssueListResponseContract ToContract(GetDashboardIssueListResponse list);
    public static partial GetDashboardIssueResponseContract ToContract(GetDashboardIssueResponse issue);
}
