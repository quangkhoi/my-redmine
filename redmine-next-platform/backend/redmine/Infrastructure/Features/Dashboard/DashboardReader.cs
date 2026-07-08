using Redmine.Application.Features.Dashboard.Services;
using Redmine.Domain.Dashboard;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Infrastructure.Features.Dashboard;

public sealed class DashboardReader : IDashboardReader
{
    private readonly IRedmineIssueRepository _repository;
    private readonly IRedmineReferenceDataRepository _referenceDataRepository;
    private readonly IRedmineUserDirectory _userDirectory;

    public DashboardReader(IRedmineIssueRepository repository, IRedmineReferenceDataRepository referenceDataRepository, IRedmineUserDirectory userDirectory)
    {
        _repository = repository;
        _referenceDataRepository = referenceDataRepository;
        _userDirectory = userDirectory;
    }

    public async Task<DashboardSummary?> GetForUserAsync(string userName, string reportDate, CancellationToken cancellationToken)
    {
        if (!_userDirectory.TryResolveUserId(userName, out var userId))
        {
            return null;
        }

        var issues = await _repository.GetIssuesAsync(new RedmineIssueQuery
        {
            AssignedToId = userId
        }, cancellationToken);
        var myIssues = issues.Where(issue => issue.AssignedTo?.Id == userId).ToList();
        var statuses = await _referenceDataRepository.GetIssueStatusesAsync(cancellationToken);
        var customFields = await _referenceDataRepository.GetCustomFieldsAsync(cancellationToken);
        var processingStatusName = FindStatusName(statuses, "処理中", "In Progress");
        var notStartedStatusName = FindStatusName(statuses, "未対応", "Not Started");
        var releaseTargetField = customFields.FirstOrDefault(field => field.Name is "Release Target" or "リリース対象");

        var openIssues = myIssues.Count(issue => issue.DoneRatio < 100 || IsStatus(issue, processingStatusName) || IsStatus(issue, notStartedStatusName));
        var hoursLogged = (int)myIssues.Sum(issue => issue.SpentHours ?? 0m);
        var attentionItems = myIssues.Count(issue =>
            (issue.DoneRatio is > 0 and < 100) ||
            IsStatus(issue, processingStatusName) ||
            HasCustomField(issue, releaseTargetField?.Name));

        var summary = new DashboardSummary(userName, reportDate, [
            new DashboardMetric("open_issues", "Open issues", openIssues),
            new DashboardMetric("hours_logged", "Hours logged", hoursLogged),
            new DashboardMetric("attention_items", "Attention items", attentionItems)
        ]);

        return summary;
    }

    private static bool IsStatus(RedmineIssueDto issue, string? statusName)
        => !string.IsNullOrWhiteSpace(statusName) && string.Equals(issue.Status?.Name, statusName, StringComparison.OrdinalIgnoreCase);

    private static bool HasCustomField(RedmineIssueDto issue, string? fieldName)
        => !string.IsNullOrWhiteSpace(fieldName) && issue.CustomFields?.Any(field => string.Equals(field.Name, fieldName, StringComparison.OrdinalIgnoreCase) && HasValue(field.Value)) == true;

    private static string? FindStatusName(IReadOnlyList<RedmineIssueStatusDto>? statuses, params string[] candidates)
        => statuses?.FirstOrDefault(status => candidates.Any(candidate => string.Equals(status.Name, candidate, StringComparison.OrdinalIgnoreCase)))?.Name;

    private static bool HasValue(System.Text.Json.JsonElement value)
        => value.ValueKind switch
        {
            System.Text.Json.JsonValueKind.Null or System.Text.Json.JsonValueKind.Undefined => false,
            System.Text.Json.JsonValueKind.Array => value.GetArrayLength() > 0,
            System.Text.Json.JsonValueKind.String => !string.IsNullOrWhiteSpace(value.GetString()),
            _ => true
        };
}
