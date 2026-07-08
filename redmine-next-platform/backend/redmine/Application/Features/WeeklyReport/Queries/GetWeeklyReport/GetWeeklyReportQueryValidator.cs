using FluentValidation;

namespace Redmine.Application.Features.WeeklyReport.Queries.GetWeeklyReport;

public sealed class GetWeeklyReportQueryValidator : AbstractValidator<GetWeeklyReportQuery>
{
    public GetWeeklyReportQueryValidator()
    {
        RuleFor(x => x.WeekStart).NotEmpty();
        RuleFor(x => x.UserName).NotEmpty();
    }
}
