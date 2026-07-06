namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineIssueRepository : IRedmineIssueRepository
{
    private readonly RedmineApiClient _client;

    public RedmineIssueRepository(RedmineApiClient client)
    {
        _client = client;
    }

    public async Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
    {
        var response = await _client.GetIssuesAsync(query, cancellationToken);
        return response.Issues;
    }

    public Task<IReadOnlyList<RedmineTimeEntryDto>> GetTimeEntriesAsync(string? spentOn, string? userName, CancellationToken cancellationToken)
    {
        return _client.GetTimeEntriesAsync(spentOn, userName, cancellationToken)
            .ContinueWith(static task => (IReadOnlyList<RedmineTimeEntryDto>)task.Result.TimeEntries, cancellationToken);
    }
}
