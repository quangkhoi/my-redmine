namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineReferenceDataRepository : IRedmineReferenceDataRepository
{
    private readonly RedmineApiClient _client;
    private readonly object _sync = new();
    private Task<IReadOnlyList<RedmineIssueStatusDto>>? _issueStatusesTask;
    private Task<IReadOnlyList<RedmineCustomFieldDto>>? _customFieldsTask;

    public RedmineReferenceDataRepository(RedmineApiClient client)
    {
        _client = client;
    }

    public async Task<IReadOnlyList<RedmineIssueStatusDto>> GetIssueStatusesAsync(CancellationToken cancellationToken)
    {
        var task = EnsureIssueStatusesTask();
        return await task;
    }

    public async Task<IReadOnlyList<RedmineCustomFieldDto>> GetCustomFieldsAsync(CancellationToken cancellationToken)
    {
        var task = EnsureCustomFieldsTask();
        return await task;
    }

    private Task<IReadOnlyList<RedmineIssueStatusDto>> EnsureIssueStatusesTask()
    {
        if (_issueStatusesTask is not null)
        {
            return _issueStatusesTask;
        }

        lock (_sync)
        {
            _issueStatusesTask ??= LoadIssueStatusesAsync();
            return _issueStatusesTask;
        }
    }

    private Task<IReadOnlyList<RedmineCustomFieldDto>> EnsureCustomFieldsTask()
    {
        if (_customFieldsTask is not null)
        {
            return _customFieldsTask;
        }

        lock (_sync)
        {
            _customFieldsTask ??= LoadCustomFieldsAsync();
            return _customFieldsTask;
        }
    }

    private async Task<IReadOnlyList<RedmineIssueStatusDto>> LoadIssueStatusesAsync()
    {
        try
        {
            return (await _client.GetIssueStatusesAsync(CancellationToken.None)).IssueStatuses ?? [];
        }
        catch (HttpRequestException)
        {
            return [];
        }
    }

    private async Task<IReadOnlyList<RedmineCustomFieldDto>> LoadCustomFieldsAsync()
    {
        try
        {
            return (await _client.GetCustomFieldsAsync(CancellationToken.None)).CustomFields ?? [];
        }
        catch (HttpRequestException)
        {
            return [];
        }
    }
}
