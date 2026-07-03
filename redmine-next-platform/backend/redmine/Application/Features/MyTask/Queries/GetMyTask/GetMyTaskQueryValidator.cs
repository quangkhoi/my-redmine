using FluentValidation;

namespace Redmine.Application.Features.MyTask.Queries.GetMyTask;

public sealed class GetMyTaskQueryValidator : AbstractValidator<GetMyTaskQuery>
{
    public GetMyTaskQueryValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty()
            .WithMessage("User name is required.");
    }
}
