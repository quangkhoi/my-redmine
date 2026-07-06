using FluentValidation;
using OneOf;
using Redmine.Application.Features.Dashboard.Services;
using Redmine.Domain.Dashboard;

namespace Redmine.Application.Features.Dashboard.Queries.GetDashboardIssues;

public sealed class GetDashboardIssuesHandler
{
    private readonly IDashboardIssueReader _reader;
    private readonly IValidator<GetDashboardIssuesQuery> _validator;

    public GetDashboardIssuesHandler(IDashboardIssueReader reader, IValidator<GetDashboardIssuesQuery> validator)
    {
        _reader = reader;
        _validator = validator;
    }

    public async Task<OneOf<GetDashboardIssuesResponse, GetDashboardIssuesValidationError>> Handle(
        GetDashboardIssuesQuery query,
        CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            return new GetDashboardIssuesValidationError(validation.Errors);
        }

        var result = await _reader.GetIssuesAsync(query.StartDate, query.EndDate, cancellationToken);
        if (result is null)
        {
            return new GetDashboardIssuesResponse(
                new GetDashboardIssueListResponse("processing", []),
                new GetDashboardIssueListResponse("notStarted", []),
                new GetDashboardIssueListResponse("processed", []));
        }

        return new GetDashboardIssuesResponse(
            MapList(result.Processing),
            MapList(result.NotStarted),
            MapList(result.Processed));
    }

    private static GetDashboardIssueListResponse MapList(DashboardIssueList list)
    {
        return new GetDashboardIssueListResponse(
            list.Name,
            list.Issues.Select(i => new GetDashboardIssueResponse(
                i.Id,
                i.Subject,
                i.ProjectName,
                i.TrackerName,
                i.StatusName,
                i.AssigneeName,
                i.StartDate,
                i.DueDate,
                i.DoneRatio,
                i.SpentHours,
                i.ReleaseTarget)).ToList());
    }
}
