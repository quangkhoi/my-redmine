using Redmine.Domain.WeeklyReport;

namespace Redmine.Application.Features.WeeklyReport.Services;

public interface IWeeklyReportReader
{
    Task<WeeklyReportSummary?> GetForUserAsync(string weekStart, string userName, CancellationToken cancellationToken);
}
