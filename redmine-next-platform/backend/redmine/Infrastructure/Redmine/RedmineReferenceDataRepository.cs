namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineReferenceDataRepository : IRedmineReferenceDataRepository
{
    private readonly IRedmineClientFacade _client;

    public RedmineReferenceDataRepository(IRedmineClientFacade client)
    {
        _client = client;
    }

    public async Task<IReadOnlyList<RedmineIssueStatusDto>> GetIssueStatusesAsync(CancellationToken cancellationToken)
        => (await _client.GetIssueStatusesAsync(cancellationToken)).IssueStatuses ?? [];

    public async Task<IReadOnlyList<RedmineCustomFieldDto>> GetCustomFieldsAsync(CancellationToken cancellationToken)
        => (await _client.GetCustomFieldsAsync(cancellationToken)).CustomFields ?? [];
}
