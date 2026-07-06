using Redmine.Application.Features.LogTime.Services;
using Redmine.Domain.LogTime;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.LogTime;

public sealed class LogTimeReader : ILogTimeReader
{
    private readonly IRedmineIssueRepository _repository;
    private readonly IRedmineUserDirectory _userDirectory;

    public LogTimeReader(IRedmineIssueRepository repository, IRedmineUserDirectory userDirectory)
    {
        _repository = repository;
        _userDirectory = userDirectory;
    }

    public async Task<LogTimeSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken)
    {
        if (!_userDirectory.TryResolveUserId(userName, out var userId))
        {
            return null;
        }

        var entries = await _repository.GetTimeEntriesAsync(reportDate, userId, cancellationToken);

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
