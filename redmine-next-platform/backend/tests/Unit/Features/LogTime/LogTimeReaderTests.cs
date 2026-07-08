using Redmine.Infrastructure.Features.LogTime;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Features.LogTime;

public sealed class LogTimeReaderTests
{
    [Fact]
    public async Task GetForUserAsync_UsesMonthRangeAndAggregatesSpentHours()
    {
        var repository = new FakeIssueRepository(
            [
                CreateIssue(201, 99, "Keep Logged", "処理中", "2026-07-01", "2026-07-31", 50),
                CreateIssue(202, 99, "Keep Done Ratio", "処理済み", "2026-07-05", "2026-07-10", 100),
                CreateIssue(203, 99, "Drop Zero Ratio", "未対応", "2026-07-05", "2026-07-10", 0),
            ],
            [
                new RedmineTimeEntryDto(1, new RedmineIssueRefDto(201, "Keep Logged"), new RedmineNameDto(99, "Tuyen"), 2m, "2026-07-02", null),
                new RedmineTimeEntryDto(2, new RedmineIssueRefDto(201, "Keep Logged"), new RedmineNameDto(94, "Nam"), 1.5m, "2026-07-03", null),
                new RedmineTimeEntryDto(3, new RedmineIssueRefDto(202, "Keep Done Ratio"), new RedmineNameDto(99, "Tuyen"), 4m, "2026-07-10", null),
            ]);
        var reader = new LogTimeReader(repository, new FakeUserDirectory(("tuyennguyen", 99)));

        var result = await reader.GetForUserAsync("2026-07-03", "tuyennguyen", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2, result!.Items.Count);

        var item201 = result.Items.Single(item => item.IssueKey == "#201");
        Assert.Equal(201, item201.IssueId);
        Assert.Equal("Keep Logged", item201.Subject);
        Assert.Equal("処理中", item201.Status);
        Assert.Equal(3.5m, item201.HoursLogged);
        Assert.Equal("Tuyen", item201.AssigneeName);
        Assert.Equal("2026-07-01", item201.StartDate);
        Assert.Equal("2026-07-31", item201.DueDate);

        var item202 = result.Items.Single(item => item.IssueKey == "#202");
        Assert.Equal(202, item202.IssueId);
        Assert.Equal("Keep Done Ratio", item202.Subject);
        Assert.Equal("処理済み", item202.Status);
        Assert.Equal(4m, item202.HoursLogged);
        Assert.Equal("Tuyen", item202.AssigneeName);
        Assert.Equal("2026-07-05", item202.StartDate);
        Assert.Equal("2026-07-10", item202.DueDate);
        Assert.Contains(repository.IssueQueries, query =>
            query.AssignedToId == 99 &&
            query.StatusId == "*" &&
            query.StartDate == "<=2026-07-31" &&
            query.DueDate == ">=2026-07-01");
        Assert.Contains(repository.TimeEntryQueries, query =>
            query.From == "2026-07-01" &&
            query.To == "2026-07-31");
    }

    private static RedmineIssueDto CreateIssue(int id, int assigneeId, string subject, string statusName, string startDate, string dueDate, int doneRatio)
        => new(
            id,
            subject,
            new RedmineNameDto(1, "Project"),
            new RedmineNameDto(2, "開発"),
            new RedmineNameDto(3, statusName),
            new RedmineNameDto(assigneeId, "Tuyen"),
            startDate,
            doneRatio,
            0m,
            dueDate,
            []);

    private sealed class FakeIssueRepository : IRedmineIssueRepository
    {
        private readonly IReadOnlyList<RedmineIssueDto> _issues;
        private readonly IReadOnlyList<RedmineTimeEntryDto> _entries;

        public FakeIssueRepository(IReadOnlyList<RedmineIssueDto> issues, IReadOnlyList<RedmineTimeEntryDto> entries)
        {
            _issues = issues;
            _entries = entries;
        }

        public List<RedmineIssueQuery> IssueQueries { get; } = [];
        public List<RedmineTimeEntryQuery> TimeEntryQueries { get; } = [];

        public Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
        {
            IssueQueries.Add(query);
            return Task.FromResult(_issues);
        }

        public Task<IReadOnlyList<RedmineTimeEntryDto>> GetTimeEntriesAsync(RedmineTimeEntryQuery query, CancellationToken cancellationToken)
        {
            TimeEntryQueries.Add(query);
            return Task.FromResult(_entries);
        }
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
