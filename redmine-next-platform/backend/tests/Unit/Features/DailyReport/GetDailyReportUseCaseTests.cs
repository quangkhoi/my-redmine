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
        Assert.Single(result.AsT0.Groups);
        Assert.Equal(2, result.AsT0.Groups[0].Items.Count);
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
                        new DailyReportGroup(
                            "99",
                            "Tuyen",
                            99,
                            [
                                new DailyReportItem(201, "RM-201", "Fix mobile nav", "Done", "開発", "2026-07-03", "2026-07-08"),
                                new DailyReportItem(202, "RM-202", "Refine report layout", "In Progress", "開発", "2026-07-03", "2026-07-09")
                            ])
                    ],
                    new DailyReportGroup("other", "Other", 114, []))
                : null;

            return Task.FromResult<DailyReportSummary?>(summary);
        }
    }
}
