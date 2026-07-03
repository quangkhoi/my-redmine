using Redmine.Application.Features.MyTask.Services;
using Redmine.Domain.MyTask;

namespace Redmine.Services.MyTask;

public sealed class InMemoryMyTaskReader : IMyTaskReader
{
    public Task<MyTaskSummary?> GetForUserAsync(string userName, CancellationToken cancellationToken)
    {
        MyTaskSummary? summary = userName.ToLowerInvariant() switch
        {
            "alice" => new MyTaskSummary(
                "alice",
                "Alice Nguyen",
                [
                    new MyTaskItem("RM-101", "Fix login redirect", "In Progress"),
                    new MyTaskItem("RM-102", "Update dashboard cards", "Open")
                ]),
            _ => null
        };

        return Task.FromResult(summary);
    }
}
