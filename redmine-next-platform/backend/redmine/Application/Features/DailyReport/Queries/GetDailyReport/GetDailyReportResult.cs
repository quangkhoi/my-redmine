using FluentValidation.Results;

namespace Redmine.Application.Features.DailyReport.Queries.GetDailyReport;

public sealed record GetDailyReportValidationError(IReadOnlyList<ValidationFailure> Failures);
public sealed record GetDailyReportNotFound;
