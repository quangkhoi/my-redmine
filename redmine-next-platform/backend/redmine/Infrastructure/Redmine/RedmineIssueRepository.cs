namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineIssueRepository : IRedmineIssueRepository
{
    private readonly IRedmineClientFacade _client;

    public RedmineIssueRepository(IRedmineClientFacade client)
    {
        _client = client;
    }

    public async Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
    {
        var response = await _client.GetIssuesAsync(query, cancellationToken);
        return response.Issues;
    }

    public Task<IReadOnlyList<RedmineTimeEntryDto>> GetTimeEntriesAsync(string? spentOn, int? userId, CancellationToken cancellationToken)
        => _client.GetTimeEntriesAsync(spentOn, userId, cancellationToken).ContinueWith(static task => (IReadOnlyList<RedmineTimeEntryDto>)task.Result.TimeEntries, cancellationToken);
}
