using Microsoft.AspNetCore.Mvc;
using Redmine.Api.Contracts.Dashboard;
using Redmine.Application.Features.Dashboard.Queries.GetDashboard;

namespace Redmine.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    [HttpGet("{reportDate}/{userName}")]
    [ProducesResponseType(typeof(GetDashboardResponseContract), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get([FromRoute] string reportDate, [FromRoute] string userName, [FromServices] GetDashboardHandler handler, CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetDashboardQuery(userName, reportDate), cancellationToken);
        return result.Match<IActionResult>(
            response => Ok(DashboardContractMapper.ToContract(response)),
            validation => BadRequest(new
            {
                message = "Validation failed.",
                errors = validation.Failures.Select(failure => new { failure.PropertyName, failure.ErrorMessage })
            }),
            _ => NotFound());
    }
}
