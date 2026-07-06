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
        if (issues.Count == 0)
        {
            return null;
        }

        return new MyTaskSummary(
            userName,
            userName,
            issues.Select(issue => new MyTaskItem($"RM-{issue.Id}", issue.Subject, issue.Status?.Name ?? "Open")).ToList());
    }
}
