using FluentValidation;

namespace Redmine.Application.Features.Dashboard.Queries.GetDashboard;

public sealed class GetDashboardQueryValidator : AbstractValidator<GetDashboardQuery>
{
    public GetDashboardQueryValidator()
    {
        RuleFor(x => x.UserName).NotEmpty();
        RuleFor(x => x.ReportDate).NotEmpty();
    }
}
