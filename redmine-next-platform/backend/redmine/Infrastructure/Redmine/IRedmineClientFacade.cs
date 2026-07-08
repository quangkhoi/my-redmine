namespace Redmine.Infrastructure.Redmine;

public interface IRedmineClientFacade
{
    Task<RedmineIssuesResponse> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken);

    Task<RedmineTimeEntriesResponse> GetTimeEntriesAsync(RedmineTimeEntryQuery query, CancellationToken cancellationToken);

    Task<RedmineIssueStatusesResponse> GetIssueStatusesAsync(CancellationToken cancellationToken);

    Task<RedmineCustomFieldsResponse> GetCustomFieldsAsync(CancellationToken cancellationToken);
}
