using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Infrastructure.Redmine;

public sealed class RedmineIssueRepositoryTests
{
    [Fact]
    public async Task GetIssuesAsync_FetchesAllPagesUntilTotalCountIsReached()
    {
        var client = new FakePagedClientFacade();
        var repository = new RedmineIssueRepository(client);

        var result = await repository.GetIssuesAsync(new RedmineIssueQuery
        {
            StatusId = "*",
            AssignedToId = 99,
            Sort = "start_date:asc,due_date:asc,id:asc"
        }, CancellationToken.None);

        Assert.Equal([0, 100], client.IssueOffsets);
        Assert.Equal([100, 100], client.IssueLimits);
        Assert.Equal([1, 2], result.Select(issue => issue.Id).ToArray());
    }

    [Fact]
    public async Task GetTimeEntriesAsync_FetchesAllPagesUntilTotalCountIsReached()
    {
        var client = new FakePagedClientFacade();
        var repository = new RedmineIssueRepository(client);

        var result = await repository.GetTimeEntriesAsync(new RedmineTimeEntryQuery
        {
            From = "2026-07-01",
            To = "2026-07-31",
            UserId = 99
        }, CancellationToken.None);

        Assert.Equal([0, 100], client.TimeEntryOffsets);
        Assert.Equal([100, 100], client.TimeEntryLimits);
        Assert.Equal([11, 12], result.Select(entry => entry.Id).ToArray());
    }

    private sealed class FakePagedClientFacade : IRedmineClientFacade
    {
        public List<int> IssueOffsets { get; } = [];
        public List<int> IssueLimits { get; } = [];
        public List<int> TimeEntryOffsets { get; } = [];
        public List<int> TimeEntryLimits { get; } = [];

        public Task<RedmineIssuesResponse> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
        {
            IssueOffsets.Add(query.Offset ?? -1);
            IssueLimits.Add(query.Limit ?? -1);

            var response = (query.Offset ?? 0) switch
            {
                0 => new RedmineIssuesResponse(
                    [
                        new RedmineIssueDto(1, "First", null, null, null, null, "2026-07-01", 10, 0m, "2026-07-02", [])
                    ],
                    2),
                100 => new RedmineIssuesResponse(
                    [
                        new RedmineIssueDto(2, "Second", null, null, null, null, "2026-07-03", 20, 0m, "2026-07-04", [])
                    ],
                    2),
                _ => new RedmineIssuesResponse([], 2)
            };

            return Task.FromResult(response);
        }

        public Task<RedmineTimeEntriesResponse> GetTimeEntriesAsync(RedmineTimeEntryQuery query, CancellationToken cancellationToken)
        {
            TimeEntryOffsets.Add(query.Offset ?? -1);
            TimeEntryLimits.Add(query.Limit ?? -1);

            var response = (query.Offset ?? 0) switch
            {
                0 => new RedmineTimeEntriesResponse(
                    [
                        new RedmineTimeEntryDto(11, new RedmineIssueRefDto(1, "First"), new RedmineNameDto(99, "Tuyen"), 2m, "2026-07-01", null)
                    ],
                    2),
                100 => new RedmineTimeEntriesResponse(
                    [
                        new RedmineTimeEntryDto(12, new RedmineIssueRefDto(2, "Second"), new RedmineNameDto(99, "Tuyen"), 3m, "2026-07-02", null)
                    ],
                    2),
                _ => new RedmineTimeEntriesResponse([], 2)
            };

            return Task.FromResult(response);
        }

        public Task<RedmineIssueStatusesResponse> GetIssueStatusesAsync(CancellationToken cancellationToken)
            => Task.FromResult(new RedmineIssueStatusesResponse([]));

        public Task<RedmineCustomFieldsResponse> GetCustomFieldsAsync(CancellationToken cancellationToken)
            => Task.FromResult(new RedmineCustomFieldsResponse([]));
    }
}
