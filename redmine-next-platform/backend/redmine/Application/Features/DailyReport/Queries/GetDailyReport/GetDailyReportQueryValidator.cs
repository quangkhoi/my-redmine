using FluentValidation;

namespace Redmine.Application.Features.DailyReport.Queries.GetDailyReport;

public sealed class GetDailyReportQueryValidator : AbstractValidator<GetDailyReportQuery>
{
    public GetDailyReportQueryValidator()
    {
        RuleFor(x => x.ReportDate).NotEmpty();
        RuleFor(x => x.UserName).NotEmpty();
    }
}
