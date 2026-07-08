using Microsoft.AspNetCore.Mvc;
using Redmine.Api.Contracts.LogTime;
using Redmine.Application.Features.LogTime.Queries.GetLogTime;

namespace Redmine.Api.Controllers;

[ApiController]
[Route("api/log-time")]
public sealed class LogTimeController : ControllerBase
{
    [HttpGet("{reportDate}/{userName}")]
    [ProducesResponseType(typeof(GetLogTimeResponseContract), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get([FromRoute] string reportDate, [FromRoute] string userName, [FromServices] GetLogTimeHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetLogTimeQuery(reportDate, userName), cancellationToken);
        return result.Match<IActionResult>(
            response => Ok(LogTimeContractMapper.ToContract(response)),
            validation => BadRequest(new
            {
                message = "Validation failed.",
                errors = validation.Failures.Select(failure => new { failure.PropertyName, failure.ErrorMessage })
            }),
            _ => NotFound());
    }
}
