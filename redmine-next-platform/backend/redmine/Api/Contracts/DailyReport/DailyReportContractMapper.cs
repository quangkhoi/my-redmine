using Redmine.Application.Features.DailyReport.Queries.GetDailyReport;
using Riok.Mapperly.Abstractions;

namespace Redmine.Api.Contracts.DailyReport;

[Mapper]
public static partial class DailyReportContractMapper
{
    public static partial GetDailyReportResponseContract ToContract(GetDailyReportResponse response);
    public static partial GetDailyReportGroupResponseContract ToContract(GetDailyReportGroupResponse response);
    public static partial GetDailyReportItemResponseContract ToContract(GetDailyReportItemResponse response);
}
