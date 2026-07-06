using FluentValidation;

namespace Redmine.Application.Features.Dashboard.Queries.GetDashboardIssues;

public sealed class GetDashboardIssuesQueryValidator : AbstractValidator<GetDashboardIssuesQuery>
{
    public GetDashboardIssuesQueryValidator()
    {
        RuleFor(x => x.StartDate)
            .NotEmpty()
            .Matches(@"^\d{4}-\d{2}-\d{2}$")
            .WithMessage("StartDate must be in yyyy-MM-dd format.");

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .Matches(@"^\d{4}-\d{2}-\d{2}$")
            .WithMessage("EndDate must be in yyyy-MM-dd format.");

        RuleFor(x => x)
            .Must(x => string.Compare(x.StartDate, x.EndDate, StringComparison.Ordinal) <= 0)
            .WithMessage("StartDate must be before or equal to EndDate.");
    }
}
