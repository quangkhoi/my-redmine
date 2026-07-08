using FluentValidation.Results;

namespace Redmine.Application.Features.Dashboard.Queries.GetDashboard;

public sealed record GetDashboardValidationError(IReadOnlyList<ValidationFailure> Failures);
public sealed record GetDashboardNotFound;
