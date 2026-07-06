using Redmine.Infrastructure.Features.MyTask;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Features.MyTask;

public sealed class MyTaskReaderTests
{
    [Fact]
    public async Task GetForUserAsync_FiltersByAssigneeDateRangeAndExcludedStatuses()
    {
        var repository = new FakeIssueRepository(
        [
            CreateIssue(101, 99, "Keep In Range", "処理中", "2026-07-01"),
            CreateIssue(102, 99, "Keep Not Started", "未対応", "2026-07-05"),
            CreateIssue(103, 99, "Exclude Done", "完了", "2026-07-03"),
            CreateIssue(104, 99, "Exclude Out Of Range", "処理中", "2026-06-30"),
        ]);
        var reader = new MyTaskReader(repository, new FakeUserDirectory(("tuyennguyen", 99)));

        var result = await reader.GetForUserAsync("tuyennguyen", "2026-07-01", "2026-07-05", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(["RM-101", "RM-102"], result!.Items.Select(item => item.IssueKey).ToArray());
        Assert.Contains(repository.Queries, query =>
            query.AssignedToId == 99 &&
            query.StatusId == "*" &&
            query.StartDate == "><2026-07-01|2026-07-05");
    }

    private static RedmineIssueDto CreateIssue(int id, int assigneeId, string subject, string statusName, string startDate)
        => new(
            id,
            subject,
            new RedmineNameDto(1, "Project"),
            new RedmineNameDto(2, "開発"),
            new RedmineNameDto(3, statusName),
            new RedmineNameDto(assigneeId, "Tuyen"),
            startDate,
            50,
            0m,
            "2026-07-10",
            []);

    private sealed class FakeIssueRepository : IRedmineIssueRepository
    {
        private readonly IReadOnlyList<RedmineIssueDto> _issues;

        public FakeIssueRepository(IReadOnlyList<RedmineIssueDto> issues)
        {
            _issues = issues;
        }

        public List<RedmineIssueQuery> Queries { get; } = [];

        public Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
        {
            Queries.Add(query);
            return Task.FromResult(_issues);
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
