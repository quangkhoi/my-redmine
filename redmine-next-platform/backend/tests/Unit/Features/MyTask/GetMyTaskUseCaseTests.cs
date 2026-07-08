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

        var result = await handler.Handle(new GetMyTaskQuery("tuyennguyen"), CancellationToken.None);

        Assert.True(result.IsT0);
        Assert.Equal("tuyennguyen", result.AsT0.UserName);
        Assert.Equal(2, result.AsT0.Items.Count);
    }

    private sealed class FakeMyTaskReader : IMyTaskReader
    {
        public Task<MyTaskSummary?> GetForUserAsync(string userName, string? startDate, string? endDate, CancellationToken cancellationToken)
        {
            MyTaskSummary? summary = userName == "tuyennguyen"
                ? new MyTaskSummary(
                    "tuyennguyen",
                    "tuyennguyen",
                    [
                        new MyTaskItem("#101", "Fix login redirect", "In Progress", "Project", "2026-07-01", "2026-07-10", 50, "開発"),
                        new MyTaskItem("#102", "Update dashboard cards", "Open", "Project", "2026-07-02", "2026-07-12", 0, "開発")
                    ])
                : null;

            return Task.FromResult(summary);
        }
    }
}
