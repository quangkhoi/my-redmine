using FluentValidation.Results;

namespace Redmine.Application.Features.LogTime.Queries.GetLogTime;

public sealed record GetLogTimeValidationError(IReadOnlyList<ValidationFailure> Failures);
public sealed record GetLogTimeNotFound;
