using Redmine.Application.Features.LogTime.Services;
using Redmine.Domain.LogTime;

namespace Redmine.Services.LogTime;

public sealed class InMemoryLogTimeReader : ILogTimeReader
{
    public Task<LogTimeSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
    {
        LogTimeSummary? summary = reportDate == "2026-07-03" && userName.ToLowerInvariant() == "alice"
            ? new LogTimeSummary(
                "alice",
                "Alice Nguyen",
                "2026-07-03",
                [
                    new LogTimeItem("RM-201", "Fix mobile nav", "Done", 2.0m),
                    new LogTimeItem("RM-202", "Refine report layout", "In Progress", 3.5m)
                ])
            : null;

        return Task.FromResult(summary);
    }
}
