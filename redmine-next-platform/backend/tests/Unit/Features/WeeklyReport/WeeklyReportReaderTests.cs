using Redmine.Infrastructure.Features.WeeklyReport;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Features.WeeklyReport;

public sealed class WeeklyReportReaderTests
{
    [Fact]
    public async Task GetForUserAsync_BuildsPreviousAndCurrentSectionsUsingLegacyReportRules()
    {
        var repository = new FakeIssueRepository(
            issuesByAssignee: new Dictionary<int, IReadOnlyList<RedmineIssueDto>>
            {
                [94] =
                [
                    CreateIssue(101, 94, "Prev CSharp", "処理中", "開発", "2026-06-29", "2026-07-03"),
                ],
                [99] =
                [
                    CreateIssue(102, 99, "Current CSharp", "未対応", "開発", "2026-07-06", "2026-07-10"),
                ],
                [106] = [],
                [123] =
                [
                    CreateIssue(201, 123, "Current Web", "処理済み", "開発", "2026-07-06", "2026-07-08"),
                ],
                [114] =
                [
                    CreateIssue(301, 114, "Special Dev", "処理中", "開発", "2026-07-07", "2026-07-09"),
                    CreateIssue(302, 114, "Ignore Research", "処理中", "調査", "2026-07-07", "2026-07-09"),
                ]
            },
            timeEntries:
            [
                new RedmineTimeEntryDto(1, new RedmineIssueRefDto(101, "Prev CSharp"), new RedmineNameDto(94, "Nam"), 2m, "2026-07-01", null),
                new RedmineTimeEntryDto(2, new RedmineIssueRefDto(301, "Special Dev"), new RedmineNameDto(114, "Khoi"), 3.5m, "2026-07-08", null),
            ]);

        var reader = new WeeklyReportReader(repository, new FakeUserDirectory(("tuyennguyen", 99)));

        var result = await reader.GetForUserAsync("2026-07-06", "tuyennguyen", CancellationToken.None);

        Assert.NotNull(result);
        Assert.True(result!.HasPrevious);
        Assert.Equal("2026-06-29", result.Range.From);
        Assert.Equal("2026-07-10", result.Range.To);
        Assert.Equal("2026-06-29", result.ExportRange.From);
        Assert.Equal("2026-07-03", result.ExportRange.To);

        Assert.Single(result.PrevCsharp);
        Assert.Equal("#101", result.PrevCsharp[0].IssueKey);
        Assert.Equal(2m, result.PrevCsharp[0].ReportSpentHours);

        Assert.Empty(result.PrevWeb);
        Assert.Equal([102, 301], result.CurrentCsharp.Select(item => item.IssueId).ToArray());
        Assert.Single(result.CurrentWeb);
        Assert.Equal(201, result.CurrentWeb[0].IssueId);
    }

    [Fact]
    public async Task GetForUserAsync_UsesLegacyFiltersForEachAssigneeRangeRequest()
    {
        var repository = new FakeIssueRepository(new Dictionary<int, IReadOnlyList<RedmineIssueDto>>(), []);
        var reader = new WeeklyReportReader(repository, new FakeUserDirectory(("tuyennguyen", 99)));

        _ = await reader.GetForUserAsync("2026-07-06", "tuyennguyen", CancellationToken.None);

        Assert.Contains(repository.IssueQueries, query =>
            query.AssignedToId == 94 &&
            query.StatusId == "*" &&
            query.StartDate == "<=2026-07-03" &&
            query.DueDate == ">=2026-06-29");

        Assert.Contains(repository.IssueQueries, query =>
            query.AssignedToId == 123 &&
            query.StatusId == "*" &&
            query.StartDate == "<=2026-07-10" &&
            query.DueDate == ">=2026-07-06");

        Assert.Equal(5, repository.TimeEntryQueries.Count);
        Assert.Contains(repository.TimeEntryQueries, query => query.From == "2026-06-29" && query.To == "2026-07-03");
        Assert.Contains(repository.TimeEntryQueries, query => query.From == "2026-07-06" && query.To == "2026-07-10");
    }

    private static RedmineIssueDto CreateIssue(int id, int assigneeId, string subject, string statusName, string trackerName, string startDate, string dueDate)
        => new(
            id,
            subject,
            new RedmineNameDto(1, "Project"),
            new RedmineNameDto(2, trackerName),
            new RedmineNameDto(3, statusName),
            new RedmineNameDto(assigneeId, $"User {assigneeId}"),
            startDate,
            50,
            0m,
            dueDate,
            []);

    private sealed class FakeIssueRepository : IRedmineIssueRepository
    {
        private readonly IReadOnlyDictionary<int, IReadOnlyList<RedmineIssueDto>> _issuesByAssignee;
        private readonly IReadOnlyList<RedmineTimeEntryDto> _timeEntries;

        public FakeIssueRepository(IReadOnlyDictionary<int, IReadOnlyList<RedmineIssueDto>> issuesByAssignee, IReadOnlyList<RedmineTimeEntryDto> timeEntries)
        {
            _issuesByAssignee = issuesByAssignee;
            _timeEntries = timeEntries;
        }

        public List<RedmineIssueQuery> IssueQueries { get; } = [];
        public List<RedmineTimeEntryQuery> TimeEntryQueries { get; } = [];

        public Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
        {
            IssueQueries.Add(query);

            if (query.AssignedToId.HasValue && _issuesByAssignee.TryGetValue(query.AssignedToId.Value, out var issues))
            {
                return Task.FromResult<IReadOnlyList<RedmineIssueDto>>(issues.Where(issue => MatchesRange(issue, query)).ToList());
            }

            return Task.FromResult<IReadOnlyList<RedmineIssueDto>>([]);
        }

        public Task<IReadOnlyList<RedmineTimeEntryDto>> GetTimeEntriesAsync(RedmineTimeEntryQuery query, CancellationToken cancellationToken)
        {
            TimeEntryQueries.Add(query);
            return Task.FromResult(_timeEntries);
        }

        private static bool MatchesRange(RedmineIssueDto issue, RedmineIssueQuery query)
        {
            var startDateMax = ParseBound(query.StartDate, "<=");
            var dueDateMin = ParseBound(query.DueDate, ">=");

            return startDateMax is null || dueDateMin is null || (issue.StartDate is not null && issue.DueDate is not null &&
                string.CompareOrdinal(issue.StartDate, startDateMax) <= 0 &&
                string.CompareOrdinal(issue.DueDate, dueDateMin) >= 0);
        }

        private static string? ParseBound(string? value, string prefix)
            => !string.IsNullOrWhiteSpace(value) && value.StartsWith(prefix, StringComparison.Ordinal)
                ? value[prefix.Length..]
                : null;
    }

    private sealed class FakeUserDirectory : IRedmineUserDirectory
    {
        private readonly Dictionary<string, int> _userIds;

        public FakeUserDirectory(params (string login, int id)[] mappings)
        {
            _userIds = mappings.ToDictionary(item => item.login, item => item.id, StringComparer.OrdinalIgnoreCase);
        }

        public bool TryResolveUserId(string userName, out int userId)
            => _userIds.TryGetValue(userName, out userId);
    }
}
