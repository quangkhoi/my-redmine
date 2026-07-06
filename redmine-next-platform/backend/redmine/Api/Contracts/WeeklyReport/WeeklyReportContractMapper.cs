using Redmine.Application.Features.WeeklyReport.Queries.GetWeeklyReport;
using Riok.Mapperly.Abstractions;

namespace Redmine.Api.Contracts.WeeklyReport;

[Mapper]
public static partial class WeeklyReportContractMapper
{
    public static partial GetWeeklyReportResponseContract ToContract(GetWeeklyReportResponse response);
    public static partial GetWeeklyReportRangeResponseContract ToContract(GetWeeklyReportRangeResponse response);
    public static partial GetWeeklyReportItemResponseContract ToContract(GetWeeklyReportItemResponse response);
}
