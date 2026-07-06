using FluentValidation;

namespace Redmine.Application.Features.MyTask.Queries.GetMyTask;

public sealed class GetMyTaskQueryValidator : AbstractValidator<GetMyTaskQuery>
{
    public GetMyTaskQueryValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty()
            .WithMessage("User name is required.");

        RuleFor(x => x)
            .Must(query => string.IsNullOrWhiteSpace(query.StartDate) == string.IsNullOrWhiteSpace(query.EndDate))
            .WithMessage("StartDate and EndDate must be provided together.");
    }
}
