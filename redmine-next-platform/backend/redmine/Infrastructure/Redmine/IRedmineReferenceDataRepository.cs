namespace Redmine.Infrastructure.Redmine;

public interface IRedmineReferenceDataRepository
{
    Task<IReadOnlyList<RedmineIssueStatusDto>> GetIssueStatusesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<RedmineCustomFieldDto>> GetCustomFieldsAsync(CancellationToken cancellationToken);
}
