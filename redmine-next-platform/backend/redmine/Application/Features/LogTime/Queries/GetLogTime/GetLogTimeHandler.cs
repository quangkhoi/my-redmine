using FluentValidation;
using OneOf;
using Redmine.Application.Features.LogTime.Services;

namespace Redmine.Application.Features.LogTime.Queries.GetLogTime;

public sealed class GetLogTimeHandler
{
    private readonly ILogTimeReader _reader;
    private readonly IValidator<GetLogTimeQuery> _validator;

    public GetLogTimeHandler(ILogTimeReader reader, IValidator<GetLogTimeQuery> validator)
    {
        _reader = reader;
        _validator = validator;
    }

    public async Task<OneOf<GetLogTimeResponse, GetLogTimeValidationError, GetLogTimeNotFound>> Handle(GetLogTimeQuery query, CancellationToken cancellationToken)
    {
        var validation = await _validator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            return new GetLogTimeValidationError(validation.Errors);
        }

        var summary = await _reader.GetForUserAsync(query.ReportDate, query.UserName, cancellationToken);
        if (summary is null)
        {
            return new GetLogTimeNotFound();
        }

        return new GetLogTimeResponse(
            summary.UserName,
            summary.DisplayName,
            summary.ReportDate,
            summary.Items.Select(item => new GetLogTimeItemResponse(item.IssueKey, item.Subject, item.Status, item.HoursLogged)).ToList());
    }
}
