using Redmine.Application.Features.DailyReport.Services;
using Redmine.Domain.DailyReport;

namespace Redmine.Services.DailyReport;

public sealed class InMemoryDailyReportReader : IDailyReportReader
{
    public Task<DailyReportSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
    {
        DailyReportSummary? summary = reportDate == "2026-07-03" && userName.ToLowerInvariant() == "alice"
            ? new DailyReportSummary(
                "2026-07-03",
                "alice",
                [
                    new DailyReportItem("RM-201", "Fix mobile nav", "Done", 2),
                    new DailyReportItem("RM-202", "Refine report layout", "In Progress", 3)
                ])
            : null;

        return Task.FromResult(summary);
    }
}
