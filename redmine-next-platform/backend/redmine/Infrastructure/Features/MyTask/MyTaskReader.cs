using Redmine.Application.Features.MyTask.Services;
using Redmine.Domain.MyTask;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.MyTask;

public sealed class MyTaskReader : IMyTaskReader
{
    private readonly IRedmineIssueRepository _repository;
    private readonly IRedmineUserDirectory _userDirectory;

    public MyTaskReader(IRedmineIssueRepository repository, IRedmineUserDirectory userDirectory)
    {
        _repository = repository;
        _userDirectory = userDirectory;
    }

    public async Task<MyTaskSummary?> GetForUserAsync(string userName, CancellationToken cancellationToken)
    {
        if (!_userDirectory.TryResolveUserId(userName, out var userId))
        {
            return null;
        }

        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery(), cancellationToken);
        var filtered = issues
            .Where(issue =>
                issue.AssignedTo?.Id == userId &&
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
