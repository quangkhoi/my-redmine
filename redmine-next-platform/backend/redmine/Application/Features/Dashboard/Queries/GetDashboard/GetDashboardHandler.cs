using FluentValidation;
using OneOf;
using Redmine.Application.Features.Dashboard.Services;

namespace Redmine.Application.Features.Dashboard.Queries.GetDashboard;

public sealed class GetDashboardHandler
{
    private readonly IDashboardReader _reader;
    private readonly IValidator<GetDashboardQuery> _validator;

    public GetDashboardHandler(IDashboardReader reader, IValidator<GetDashboardQuery> validator)
    {
        _reader = reader;
        _validator = validator;
    }

    public async Task<OneOf<GetDashboardResponse, GetDashboardValidationError, GetDashboardNotFound>> Handle(GetDashboardQuery query, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            return new GetDashboardValidationError(validation.Errors);
        }

        var summary = await _reader.GetForUserAsync(query.UserName, query.ReportDate, cancellationToken);
        if (summary is null)
        {
            return new GetDashboardNotFound();
        }

        return new GetDashboardResponse(
            summary.UserName,
            summary.ReportDate,
            summary.Metrics.Select(metric => new GetDashboardMetricResponse(metric.Code, metric.Label, metric.Value)).ToList());
    }
}
