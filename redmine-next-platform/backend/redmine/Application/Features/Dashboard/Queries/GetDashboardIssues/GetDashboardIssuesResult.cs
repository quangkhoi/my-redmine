using FluentValidation.Results;

namespace Redmine.Application.Features.Dashboard.Queries.GetDashboardIssues;

public sealed record GetDashboardIssuesValidationError(IReadOnlyList<ValidationFailure> Failures);
