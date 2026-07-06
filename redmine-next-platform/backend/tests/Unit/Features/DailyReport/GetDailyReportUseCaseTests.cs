using Redmine.Application.Features.DailyReport.Queries.GetDailyReport;
using Redmine.Application.Features.DailyReport.Services;
using Redmine.Domain.DailyReport;

namespace Redmine.Tests.Unit.Features.DailyReport;

public sealed class GetDailyReportUseCaseTests
{
    [Fact]
    public async Task Handle_ReturnsReportWhenReaderFindsEntries()
    {
        var reader = new FakeDailyReportReader();
        var handler = new GetDailyReportHandler(reader, new GetDailyReportQueryValidator());

        var result = await handler.Handle(new GetDailyReportQuery("2026-07-03", "tuyennguyen"), CancellationToken.None);

        Assert.True(result.IsT0);
        Assert.Equal("2026-07-03", result.AsT0.ReportDate);
        Assert.Equal(2, result.AsT0.Items.Count);
    }

    private sealed class FakeDailyReportReader : IDailyReportReader
    {
        public Task<DailyReportSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
        {
            DailyReportSummary? summary = reportDate == "2026-07-03" && userName == "tuyennguyen"
                ? new DailyReportSummary(
                    "2026-07-03",
                    "tuyennguyen",
                    [
                        new DailyReportItem("RM-201", "Fix mobile nav", "Done", 2),
                        new DailyReportItem("RM-202", "Refine report layout", "In Progress", 3)
                    ])
                : null;

            return Task.FromResult(summary);
        }
    }
}
