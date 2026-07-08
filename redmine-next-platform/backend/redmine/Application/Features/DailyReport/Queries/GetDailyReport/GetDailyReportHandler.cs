using FluentValidation;
using OneOf;
using Redmine.Application.Features.DailyReport.Services;

namespace Redmine.Application.Features.DailyReport.Queries.GetDailyReport;

public sealed class GetDailyReportHandler
{
    private readonly IDailyReportReader _reader;
    private readonly IValidator<GetDailyReportQuery> _validator;

    public GetDailyReportHandler(IDailyReportReader reader, IValidator<GetDailyReportQuery> validator)
    {
        _reader = reader;
        _validator = validator;
    }

    public async Task<OneOf<GetDailyReportResponse, GetDailyReportValidationError, GetDailyReportNotFound>> Handle(GetDailyReportQuery query, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            return new GetDailyReportValidationError(validation.Errors);
        }

        var summary = await _reader.GetForUserAsync(query.ReportDate, query.UserName, cancellationToken);
        if (summary is null)
        {
            return new GetDailyReportNotFound();
        }

        return new GetDailyReportResponse(
            summary.ReportDate,
            summary.UserName,
            summary.Groups.Select(ToGroupResponse).ToList(),
            ToGroupResponse(summary.Other));
    }

    private static GetDailyReportGroupResponse ToGroupResponse(Domain.DailyReport.DailyReportGroup group)
        => new(
            group.Key,
            group.Label,
            group.AssigneeId,
            group.Items.Select(item => new GetDailyReportItemResponse(
                item.IssueId,
                item.IssueKey,
                item.Subject,
                item.Status,
                item.TrackerName,
                item.ProjectName,
                item.StartDate,
                item.DueDate)).ToList());
}
