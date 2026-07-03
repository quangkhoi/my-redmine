using FluentValidation;

namespace Redmine.Application.Features.LogTime.Queries.GetLogTime;

public sealed class GetLogTimeQueryValidator : AbstractValidator<GetLogTimeQuery>
{
    public GetLogTimeQueryValidator()
    {
        RuleFor(x => x.ReportDate).NotEmpty().WithMessage("Report date is required.");
        RuleFor(x => x.UserName).NotEmpty().WithMessage("User name is required.");
    }
}
