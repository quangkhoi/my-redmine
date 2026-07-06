using Microsoft.AspNetCore.Mvc;
using Redmine.Api.Contracts.DashboardIssues;
using Redmine.Application.Features.Dashboard.Queries.GetDashboardIssues;

namespace Redmine.Api.Controllers;

[ApiController]
[Route("api/dashboard/issues")]
public sealed class DashboardIssuesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(GetDashboardIssuesResponseContract), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Get(
        [FromQuery] string startDate,
        [FromQuery] string endDate,
        [FromServices] GetDashboardIssuesHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetDashboardIssuesQuery(startDate, endDate), cancellationToken);
        return result.Match<IActionResult>(
            response => Ok(DashboardIssuesContractMapper.ToContract(response)),
            validation => BadRequest(new
            {
                message = "Validation failed.",
                errors = validation.Failures.Select(failure => new { failure.PropertyName, failure.ErrorMessage })
            }));
    }
}
