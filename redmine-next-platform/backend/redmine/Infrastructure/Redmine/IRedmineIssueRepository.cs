namespace Redmine.Infrastructure.Redmine;

public interface IRedmineIssueRepository
{
    Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken);

    Task<IReadOnlyList<RedmineTimeEntryDto>> GetTimeEntriesAsync(RedmineTimeEntryQuery query, CancellationToken cancellationToken);
}
