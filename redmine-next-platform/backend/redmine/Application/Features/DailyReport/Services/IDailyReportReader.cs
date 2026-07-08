using Redmine.Domain.DailyReport;

namespace Redmine.Application.Features.DailyReport.Services;

public interface IDailyReportReader
{
    Task<DailyReportSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken);
}
