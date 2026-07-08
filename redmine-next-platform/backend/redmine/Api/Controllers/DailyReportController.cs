using Microsoft.AspNetCore.Mvc;
using Redmine.Api.Contracts.DailyReport;
using Redmine.Application.Features.DailyReport.Queries.GetDailyReport;

namespace Redmine.Api.Controllers;

[ApiController]
[Route("api/daily-report")]
public sealed class DailyReportController : ControllerBase
{
    [HttpGet("{reportDate}/{userName}")]
    [ProducesResponseType(typeof(GetDailyReportResponseContract), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get([FromRoute] string reportDate, [FromRoute] string userName, [FromServices] GetDailyReportHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetDailyReportQuery(reportDate, userName), cancellationToken);
        return result.Match<IActionResult>(
            response => Ok(DailyReportContractMapper.ToContract(response)),
            validation => BadRequest(new
            {
                message = "Validation failed.",
                errors = validation.Failures.Select(failure => new { failure.PropertyName, failure.ErrorMessage })
            }),
            _ => NotFound());
    }
}
