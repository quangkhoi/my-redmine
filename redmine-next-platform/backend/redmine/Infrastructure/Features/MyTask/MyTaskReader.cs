using Redmine.Application.Features.MyTask.Services;
using Redmine.Domain.MyTask;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.MyTask;

public sealed class MyTaskReader : IMyTaskReader
{
    private readonly IRedmineIssueRepository _repository;

    public MyTaskReader(IRedmineIssueRepository repository)
    {
        _repository = repository;
    }

    public async Task<MyTaskSummary?> GetForUserAsync(string userName, CancellationToken cancellationToken)
    {
        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery(), cancellationToken);
        var filtered = issues
            .Where(issue =>
                string.Equals(issue.AssignedTo?.Name, userName, StringComparison.OrdinalIgnoreCase) &&
                issue.DoneRatio < 100)
            .ToList();

        if (filtered.Count == 0)
        {
            return null;
        }

        return new MyTaskSummary(
            userName,
            userName,
            filtered.Select(issue => new MyTaskItem($"RM-{issue.Id}", issue.Subject, issue.Status?.Name ?? "Open")).ToList());
    }
}
