using Microsoft.AspNetCore.Mvc;
using Redmine.Api.Contracts.WeeklyReport;
using Redmine.Application.Features.WeeklyReport.Queries.GetWeeklyReport;

namespace Redmine.Api.Controllers;

[ApiController]
[Route("api/weekly-report")]
public sealed class WeeklyReportController : ControllerBase
{
    [HttpGet("{weekStart}/{userName}")]
    [ProducesResponseType(typeof(GetWeeklyReportResponseContract), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get([FromRoute] string weekStart, [FromRoute] string userName, [FromServices] GetWeeklyReportHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetWeeklyReportQuery(weekStart, userName), cancellationToken);
        return result.Match<IActionResult>(
            response => Ok(WeeklyReportContractMapper.ToContract(response)),
            validation => BadRequest(new
            {
                message = "Validation failed.",
                errors = validation.Failures.Select(failure => new { failure.PropertyName, failure.ErrorMessage })
            }),
            _ => NotFound());
    }
}
