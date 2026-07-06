namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineApiClient
{
    private readonly IRedmineClientFacade _facade;

    public RedmineApiClient(IRedmineClientFacade facade)
    {
        _facade = facade;
    }

    public Task<RedmineIssuesResponse> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
        => _facade.GetIssuesAsync(query, cancellationToken);

    public Task<RedmineTimeEntriesResponse> GetTimeEntriesAsync(string? spentOn, int? userId, CancellationToken cancellationToken)
        => _facade.GetTimeEntriesAsync(spentOn, userId, cancellationToken);

    public Task<RedmineIssueStatusesResponse> GetIssueStatusesAsync(CancellationToken cancellationToken)
        => _facade.GetIssueStatusesAsync(cancellationToken);

    public Task<RedmineCustomFieldsResponse> GetCustomFieldsAsync(CancellationToken cancellationToken)
        => _facade.GetCustomFieldsAsync(cancellationToken);
}
