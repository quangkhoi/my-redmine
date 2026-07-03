using FluentValidation.Results;

namespace Redmine.Application.Features.WeeklyReport.Queries.GetWeeklyReport;

public sealed record GetWeeklyReportValidationError(IReadOnlyList<ValidationFailure> Failures);
public sealed record GetWeeklyReportNotFound;
