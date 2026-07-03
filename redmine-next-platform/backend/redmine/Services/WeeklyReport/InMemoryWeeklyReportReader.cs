using Redmine.Application.Features.WeeklyReport.Services;
using Redmine.Domain.WeeklyReport;

namespace Redmine.Services.WeeklyReport;

public sealed class InMemoryWeeklyReportReader : IWeeklyReportReader
{
    public Task<WeeklyReportSummary?> GetForUserAsync(string weekStart, string userName, CancellationToken cancellationToken)
    {
        WeeklyReportSummary? summary = weekStart == "2026-06-29" && userName.ToLowerInvariant() == "alice"
            ? new WeeklyReportSummary(
                "2026-06-29",
                "2026-07-05",
                "alice",
                [
                    new WeeklyReportItem("RM-301", "Plan weekly backlog", "Done", "Mon", 1),
                    new WeeklyReportItem("RM-302", "Implement dashboard cards", "Done", "Tue", 4),
                    new WeeklyReportItem("RM-303", "Refine API contracts", "In Progress", "Thu", 3),
                    new WeeklyReportItem("RM-304", "Polish weekly summary", "Open", "Fri", 2)
                ])
            : null;

        return Task.FromResult(summary);
    }
}
