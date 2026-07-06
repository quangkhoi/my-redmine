using Redmine.Application.Features.LogTime.Services;
using Redmine.Domain.LogTime;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.LogTime;

public sealed class LogTimeReader : ILogTimeReader
{
    private readonly IRedmineIssueRepository _repository;

    public LogTimeReader(IRedmineIssueRepository repository)
    {
        _repository = repository;
    }

    public async Task<LogTimeSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
    {
        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            SpentOn = reportDate
        }, cancellationToken);

        if (issues.Count == 0)
        {
            return null;
        }

        return new LogTimeSummary(
            userName,
            userName,
            reportDate,
            issues.Select((issue, index) => new LogTimeItem($"RM-{issue.Id}", issue.Subject, issue.Status?.Name ?? "Open", index + 1.0m)).ToList());
    }
}
