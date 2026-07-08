using Redmine.Domain.DailyReport;
using Redmine.Infrastructure.Features.DailyReport;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Features.DailyReport;

public sealed class DailyReportReaderTests
{
    [Fact]
    public async Task GetForUserAsync_GroupsIssuesByAssigneeAndKeepsOtherBucket()
    {
        var repository = new FakeIssueRepository(new Dictionary<string, IReadOnlyList<RedmineIssueDto>>
        {
            ["today"] =
            [
                CreateIssue(201, 99, "Today Tuyen", "未対応", "開発", "2026-07-03", "2026-07-08", 0),
                CreateIssue(202, 123, "Today Phi", "処理中", "開発", "2026-07-03", "2026-07-09", 20),
            ],
            ["processing"] =
            [
                CreateIssue(202, 123, "Today Phi", "処理中", "開発", "2026-07-03", "2026-07-09", 20),
                CreateIssue(203, 94, "Processing Nam", "処理中", "開発", "2026-07-01", "2026-07-04", 80),
                CreateIssue(204, 94, "Done Ratio Ignored", "処理中", "開発", "2026-07-01", "2026-07-04", 100),
            ],
            ["other"] =
            [
                CreateIssue(301, 114, "Other Dev", "処理中", "開発", "2026-07-02", "2026-07-10", 50),
                CreateIssue(302, 114, "Other Research Ignored", "処理中", "調査", "2026-07-02", "2026-07-10", 50),
                CreateIssue(303, 114, "Other Done Ignored", "完了", "開発", "2026-07-02", "2026-07-10", 100),
            ]
        });

        var reader = new DailyReportReader(repository, new FakeUserDirectory(("tuyennguyen", 99)));

        var result = await reader.GetForUserAsync("2026-07-03", "tuyennguyen", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(4, result!.Groups.Count);
        Assert.Equal([203], result.Groups.Single(group => group.AssigneeId == 94).Items.Select(item => item.IssueId).ToArray());
        Assert.Equal([201], result.Groups.Single(group => group.AssigneeId == 99).Items.Select(item => item.IssueId).ToArray());
        Assert.Empty(result.Groups.Single(group => group.AssigneeId == 106).Items);
        Assert.Equal([202], result.Groups.Single(group => group.AssigneeId == 123).Items.Select(item => item.IssueId).ToArray());
        Assert.Equal([301], result.Other.Items.Select(item => item.IssueId).ToArray());
    }

    [Fact]
    public async Task GetForUserAsync_UsesLegacyIssueQueries()
    {
        var repository = new FakeIssueRepository(new Dictionary<string, IReadOnlyList<RedmineIssueDto>>());

        var reader = new DailyReportReader(repository, new FakeUserDirectory(("tuyennguyen", 99)));

        _ = await reader.GetForUserAsync("2026-07-03", "tuyennguyen", CancellationToken.None);

        Assert.Contains(repository.Queries, query =>
            query.AssignedToId == 94 &&
            query.StatusId == "*" &&
            query.StartDate == "><2026-07-03|2026-07-03");
        Assert.Contains(repository.Queries, query =>
            query.AssignedToId == 94 &&
            query.StatusId == "2");
        Assert.Contains(repository.Queries, query =>
            query.AssignedToId == 114 &&
            query.StatusId == "*" &&
            query.StartDate == "<=2026-07-03");
    }

    [Fact]
    public async Task GetForUserAsync_ReturnsNullWhenUserCannotBeResolved()
    {
        var repository = new FakeIssueRepository(new Dictionary<string, IReadOnlyList<RedmineIssueDto>>());
        var reader = new DailyReportReader(repository, new FakeUserDirectory());

        var result = await reader.GetForUserAsync("2026-07-03", "missing", CancellationToken.None);

        Assert.Null(result);
    }

    private static RedmineIssueDto CreateIssue(int id, int assigneeId, string subject, string statusName, string trackerName, string startDate, string dueDate, int doneRatio)
        => new(
            id,
            subject,
            new RedmineNameDto(1, "Project"),
            new RedmineNameDto(2, trackerName),
            new RedmineNameDto(3, statusName),
            new RedmineNameDto(assigneeId, $"User {assigneeId}"),
            startDate,
            doneRatio,
            0m,
            dueDate,
            []);

    private sealed class FakeIssueRepository : IRedmineIssueRepository
    {
        private readonly IReadOnlyDictionary<string, IReadOnlyList<RedmineIssueDto>> _issues;

        public FakeIssueRepository(IReadOnlyDictionary<string, IReadOnlyList<RedmineIssueDto>> issues)
        {
            _issues = issues;
        }

        public List<RedmineIssueQuery> Queries { get; } = [];

        public Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
        {
            Queries.Add(query);

            if (query.AssignedToId == 114)
            {
                return Task.FromResult(_issues.TryGetValue("other", out var other) ? other : []);
            }

            if (query.StatusId == "2")
            {
                return Task.FromResult(_issues.TryGetValue("processing", out var processing) ? processing : []);
            }

            return Task.FromResult(_issues.TryGetValue("today", out var today) ? today : []);
        }

        public Task<IReadOnlyList<RedmineTimeEntryDto>> GetTimeEntriesAsync(RedmineTimeEntryQuery query, CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<RedmineTimeEntryDto>>([]);
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
