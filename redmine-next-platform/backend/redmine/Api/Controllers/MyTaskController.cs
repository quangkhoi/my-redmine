using Microsoft.AspNetCore.Mvc;
using Redmine.Api.Contracts.MyTask;
using Redmine.Application.Features.MyTask.Queries.GetMyTask;

namespace Redmine.Api.Controllers;

[ApiController]
[Route("api/my-task")]
public sealed class MyTaskController : ControllerBase
{
    [HttpGet("{userName}")]
    [ProducesResponseType(typeof(GetMyTaskResponseContract), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(
        [FromRoute] string userName,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate,
        [FromServices] GetMyTaskHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetMyTaskQuery(userName, startDate, endDate), cancellationToken);
        return result.Match<IActionResult>(
            response => Ok(MyTaskContractMapper.ToContract(response)),
            validation => BadRequest(new
            {
                message = "Validation failed.",
                errors = validation.Failures.Select(failure => new { failure.PropertyName, failure.ErrorMessage })
            }),
            _ => NotFound());
    }
}
