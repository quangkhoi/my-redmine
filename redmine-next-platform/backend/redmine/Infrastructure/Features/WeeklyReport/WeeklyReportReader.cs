using Redmine.Application.Features.WeeklyReport.Services;
using Redmine.Domain.WeeklyReport;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.WeeklyReport;

public sealed class WeeklyReportReader : IWeeklyReportReader
{
    private readonly IRedmineIssueRepository _repository;
    private readonly IRedmineReferenceDataRepository _referenceDataRepository;

    public WeeklyReportReader(IRedmineIssueRepository repository, IRedmineReferenceDataRepository referenceDataRepository)
    {
        _repository = repository;
        _referenceDataRepository = referenceDataRepository;
    }

    public async Task<WeeklyReportSummary?> GetForUserAsync(string weekStart, string userName, CancellationToken cancellationToken)
    {
        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            UpdatedOn = weekStart
        }, cancellationToken);
        var statuses = await _referenceDataRepository.GetIssueStatusesAsync(cancellationToken);
        var doneStatusName = FindStatusName(statuses, "処理済み", "Done", "Closed");
        var inProgressStatusName = FindStatusName(statuses, "処理中", "In Progress");

        if (issues.Count == 0)
        {
            return null;
        }

        var weekEnd = DateOnly.Parse(weekStart).AddDays(6).ToString("yyyy-MM-dd");

        return new WeeklyReportSummary(
            weekStart,
            weekEnd,
            userName,
            issues.Select((issue, index) => new WeeklyReportItem(
                $"RM-{issue.Id}",
                issue.Subject,
                ResolveWeeklyStatus(issue, doneStatusName, inProgressStatusName),
                "Mon",
                index + 1)).ToList());
    }

    private static string ResolveWeeklyStatus(RedmineIssueDto issue, string? doneStatusName, string? inProgressStatusName)
    {
        if (!string.IsNullOrWhiteSpace(doneStatusName) && string.Equals(issue.Status?.Name, doneStatusName, StringComparison.OrdinalIgnoreCase))
        {
            return "Done";
        }

        if (!string.IsNullOrWhiteSpace(inProgressStatusName) && string.Equals(issue.Status?.Name, inProgressStatusName, StringComparison.OrdinalIgnoreCase))
        {
            return "In Progress";
        }

        return issue.Status?.Name ?? "Open";
    }

    private static string? FindStatusName(IReadOnlyList<RedmineIssueStatusDto> statuses, params string[] candidates)
        => statuses.FirstOrDefault(status => candidates.Any(candidate => string.Equals(status.Name, candidate, StringComparison.OrdinalIgnoreCase)))?.Name;
}
