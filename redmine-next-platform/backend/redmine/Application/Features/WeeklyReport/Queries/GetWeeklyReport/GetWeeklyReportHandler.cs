using FluentValidation;
using OneOf;
using Redmine.Application.Features.WeeklyReport.Services;

namespace Redmine.Application.Features.WeeklyReport.Queries.GetWeeklyReport;

public sealed class GetWeeklyReportHandler
{
    private readonly IWeeklyReportReader _reader;
    private readonly IValidator<GetWeeklyReportQuery> _validator;

    public GetWeeklyReportHandler(IWeeklyReportReader reader, IValidator<GetWeeklyReportQuery> validator)
    {
        _reader = reader;
        _validator = validator;
    }

    public async Task<OneOf<GetWeeklyReportResponse, GetWeeklyReportValidationError, GetWeeklyReportNotFound>> Handle(GetWeeklyReportQuery query, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            return new GetWeeklyReportValidationError(validation.Errors);
        }

        var summary = await _reader.GetForUserAsync(query.WeekStart, query.UserName, cancellationToken);
        if (summary is null)
        {
            return new GetWeeklyReportNotFound();
        }

        return new GetWeeklyReportResponse(
            summary.WeekStart,
            summary.WeekEnd,
            summary.UserName,
            summary.Items.Select(item => new GetWeeklyReportItemResponse(item.IssueKey, item.Subject, item.Status, item.Day, item.HoursSpent)).ToList());
    }
}
