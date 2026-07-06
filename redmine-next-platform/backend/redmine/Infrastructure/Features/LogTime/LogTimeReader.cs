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
        var entries = await _repository.GetTimeEntriesAsync(reportDate, userName, cancellationToken);

        if (entries.Count == 0)
        {
            return null;
        }

        return new LogTimeSummary(
            userName,
            userName,
            reportDate,
            entries.Select(entry => new LogTimeItem(
                entry.Issue?.Id is { } issueId ? $"RM-{issueId}" : $"TE-{entry.Id}",
                entry.Issue?.Subject ?? entry.Comments ?? "Time entry",
                "Logged",
                entry.Hours)).ToList());
    }
}
