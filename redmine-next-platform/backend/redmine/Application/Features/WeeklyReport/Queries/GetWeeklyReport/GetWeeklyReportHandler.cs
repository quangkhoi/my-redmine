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
            summary.UserName,
            summary.HasPrevious,
            new GetWeeklyReportRangeResponse(summary.Range.From, summary.Range.To),
            new GetWeeklyReportRangeResponse(summary.ExportRange.From, summary.ExportRange.To),
            summary.PrevCsharp.Select(ToResponse).ToList(),
            summary.PrevWeb.Select(ToResponse).ToList(),
            summary.CurrentCsharp.Select(ToResponse).ToList(),
            summary.CurrentWeb.Select(ToResponse).ToList());
    }

    private static GetWeeklyReportItemResponse ToResponse(Domain.WeeklyReport.WeeklyReportItem item)
        => new(
            item.IssueId,
            item.IssueKey,
            item.ProjectName,
            item.Subject,
            item.Status,
            item.TrackerName,
            item.StartDate,
            item.DueDate,
            item.ReportSpentHours);
}
