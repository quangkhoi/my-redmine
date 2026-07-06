namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineIssueRepository : IRedmineIssueRepository
{
    private const int PageSize = 100;
    private readonly IRedmineClientFacade _client;

    public RedmineIssueRepository(IRedmineClientFacade client)
    {
        _client = client;
    }

    public async Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
    {
        var results = new List<RedmineIssueDto>();
        var offset = 0;
        var totalCount = int.MaxValue;

        while (results.Count < totalCount)
        {
            var response = await _client.GetIssuesAsync(new RedmineIssueQuery
            {
                StatusId = query.StatusId,
                AssignedToId = query.AssignedToId,
                StartDate = query.StartDate,
                DueDate = query.DueDate,
                UpdatedOn = query.UpdatedOn,
                SpentOn = query.SpentOn,
                Sort = query.Sort,
                Limit = query.Limit ?? PageSize,
                Offset = query.Offset.HasValue ? query.Offset.Value + offset : offset
            }, cancellationToken);

            var page = response.Issues ?? [];
            results.AddRange(page);
            totalCount = response.TotalCount;

            if (page.Count == 0)
            {
                break;
            }

            offset += query.Limit ?? PageSize;
        }

        return results;
    }

    public async Task<IReadOnlyList<RedmineTimeEntryDto>> GetTimeEntriesAsync(RedmineTimeEntryQuery query, CancellationToken cancellationToken)
    {
        var results = new List<RedmineTimeEntryDto>();
        var offset = 0;
        var totalCount = int.MaxValue;

        while (results.Count < totalCount)
        {
            var response = await _client.GetTimeEntriesAsync(new RedmineTimeEntryQuery
            {
                IssueId = query.IssueId,
                UserId = query.UserId,
                From = query.From,
                To = query.To,
                Limit = query.Limit ?? PageSize,
                Offset = query.Offset.HasValue ? query.Offset.Value + offset : offset
            }, cancellationToken);

            var page = response.TimeEntries ?? [];
            results.AddRange(page);
            totalCount = response.TotalCount;

            if (page.Count == 0)
            {
                break;
            }

            offset += query.Limit ?? PageSize;
        }

        return results;
    }
}
