using FluentValidation;
using OneOf;
using Redmine.Application.Features.MyTask.Services;

namespace Redmine.Application.Features.MyTask.Queries.GetMyTask;

public sealed class GetMyTaskHandler
{
    private readonly IMyTaskReader _reader;
    private readonly IValidator<GetMyTaskQuery> _validator;

    public GetMyTaskHandler(IMyTaskReader reader, IValidator<GetMyTaskQuery> validator)
    {
        _reader = reader;
        _validator = validator;
    }

    public async Task<OneOf<GetMyTaskResponse, GetMyTaskValidationError, GetMyTaskNotFound>> Handle(GetMyTaskQuery query, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            return new GetMyTaskValidationError(validation.Errors);
        }

        var summary = await _reader.GetForUserAsync(query.UserName, query.StartDate, query.EndDate, cancellationToken);
        if (summary is null)
        {
            return new GetMyTaskNotFound();
        }

        return new GetMyTaskResponse(
            summary.UserName,
            summary.DisplayName,
            summary.Items.Select(item => new GetMyTaskItemResponse(item.IssueKey, item.Subject, item.Status)).ToList());
    }
}
