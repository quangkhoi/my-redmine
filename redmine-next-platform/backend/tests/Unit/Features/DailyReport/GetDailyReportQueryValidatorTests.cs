using Redmine.Application.Features.DailyReport.Queries.GetDailyReport;

namespace Redmine.Tests.Unit.Features.DailyReport;

public sealed class GetDailyReportQueryValidatorTests
{
    [Fact]
    public void Validate_RejectsEmptyReportDate()
    {
        var validator = new GetDailyReportQueryValidator();

        var result = validator.Validate(new GetDailyReportQuery(string.Empty, "alice"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(GetDailyReportQuery.ReportDate));
    }
}
