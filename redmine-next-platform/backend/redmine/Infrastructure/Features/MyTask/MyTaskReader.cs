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

    public async Task<MyTaskSummary?> GetForUserAsync(string userName, string? startDate, string? endDate, CancellationToken cancellationToken)
    {
        if (!_userDirectory.TryResolveUserId(userName, out var userId))
        {
            return null;
        }

        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            StatusId = "*",
            AssignedToId = userId,
            StartDate = !string.IsNullOrWhiteSpace(startDate) && !string.IsNullOrWhiteSpace(endDate)
                ? $"><{startDate}|{endDate}"
                : null,
            Sort = "start_date:asc,due_date:asc,id:asc"
        }, cancellationToken);
        var filtered = LegacyRedmineRules.SortIssues(issues.Where(issue =>
                issue.AssignedTo?.Id == userId &&
                LegacyRedmineRules.IsMyTaskIssue(issue) &&
                (string.IsNullOrWhiteSpace(startDate) || string.IsNullOrWhiteSpace(endDate) ||
                    (LegacyRedmineRules.DateGte(issue.StartDate, DateOnly.Parse(startDate)) &&
                     LegacyRedmineRules.DateLte(issue.StartDate, DateOnly.Parse(endDate))))))
            .ToList();

        return new MyTaskSummary(
            userName,
            userName,
            filtered.Select(issue => new MyTaskItem(
                $"#{issue.Id}",
                issue.Subject,
                issue.Status?.Name ?? "Open",
                issue.Project?.Name,
                issue.StartDate,
                issue.DueDate,
                issue.DoneRatio,
                issue.Tracker?.Name)).ToList());
    }
}
