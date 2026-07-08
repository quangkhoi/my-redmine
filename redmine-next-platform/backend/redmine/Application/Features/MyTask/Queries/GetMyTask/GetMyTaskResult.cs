using FluentValidation.Results;

namespace Redmine.Application.Features.MyTask.Queries.GetMyTask;

public sealed record GetMyTaskValidationError(IReadOnlyList<ValidationFailure> Failures);
public sealed record GetMyTaskNotFound;
