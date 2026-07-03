using Redmine.Application.Features.MyTask.Queries.GetMyTask;
using Redmine.Application.Features.MyTask.Services;
using Redmine.Domain.MyTask;

namespace Redmine.Tests.Unit.Features.MyTask;

public sealed class GetMyTaskUseCaseTests
{
    [Fact]
    public async Task Handle_ReturnsSummaryWhenReaderFindsTasks()
    {
        var reader = new FakeMyTaskReader();
        var handler = new GetMyTaskHandler(reader, new GetMyTaskQueryValidator());

        var result = await handler.Handle(new GetMyTaskQuery("alice"), CancellationToken.None);

        Assert.True(result.IsT0);
        Assert.Equal("alice", result.AsT0.UserName);
        Assert.Equal(2, result.AsT0.Items.Count);
    }

    private sealed class FakeMyTaskReader : IMyTaskReader
    {
        public Task<MyTaskSummary?> GetForUserAsync(string userName, CancellationToken cancellationToken)
        {
            MyTaskSummary? summary = userName == "alice"
                ? new MyTaskSummary(
                    "alice",
                    "Alice Nguyen",
                    [
                        new MyTaskItem("RM-101", "Fix login redirect", "In Progress"),
                        new MyTaskItem("RM-102", "Update dashboard cards", "Open")
                    ])
                : null;

            return Task.FromResult(summary);
        }
    }
}
