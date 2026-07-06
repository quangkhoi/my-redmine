using Redmine.Domain.DailyReport;
using Redmine.Infrastructure.Features.DailyReport;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Features.DailyReport;

public sealed class DailyReportReaderTests
{
    [Fact]
    public async Task GetForUserAsync_UsesAssignedAndTrackerFilteredIssues()
    {
        var repository = new FakeIssueRepository([
            new RedmineIssueDto(
                201,
                "Fix mobile nav",
                new RedmineNameDto(1, "Project"),
                new RedmineNameDto(2, "開発"),
                new RedmineNameDto(3, "処理中"),
                new RedmineNameDto(7, "tuyennguyen"),
                "2026-07-01",
                50,
                2m,
                "2026-07-03",
                []),
            new RedmineIssueDto(
                202,
                "Refine report layout",
                new RedmineNameDto(1, "Project"),
                new RedmineNameDto(2, "開発"),
                new RedmineNameDto(3, "未対応"),
                new RedmineNameDto(7, "tuyennguyen"),
                "2026-07-01",
                10,
                3m,
                "2026-07-03",
                [])
        ]);

        var reader = new DailyReportReader(repository, new FakeUserDirectory(("tuyennguyen", 7)));

        var result = await reader.GetForUserAsync("2026-07-03", "tuyennguyen", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2, result!.Items.Count);
    }

    [Fact]
    public async Task GetForUserAsync_UsesResolvedUserId()
    {
        var repository = new FakeIssueRepository([
            new RedmineIssueDto(
                201,
                "Fix mobile nav",
                new RedmineNameDto(1, "Project"),
                new RedmineNameDto(2, "開発"),
                new RedmineNameDto(3, "処理中"),
                new RedmineNameDto(7, "Tuyen Nguyen"),
                "2026-07-01",
                50,
                2m,
                "2026-07-03",
                [])
        ]);

        var reader = new DailyReportReader(repository, new FakeUserDirectory(("tuyennguyen", 7)));

        var result = await reader.GetForUserAsync("2026-07-03", "tuyennguyen", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Single(result!.Items);
    }

    [Fact]
    public async Task GetForUserAsync_ReturnsNullWhenUserCannotBeResolved()
    {
        var repository = new FakeIssueRepository([]);
        var reader = new DailyReportReader(repository, new FakeUserDirectory());

        var result = await reader.GetForUserAsync("2026-07-03", "missing", CancellationToken.None);

        Assert.Null(result);
    }

    private sealed class FakeIssueRepository : IRedmineIssueRepository
    {
        private readonly IReadOnlyList<RedmineIssueDto> _issues;

        public FakeIssueRepository(IReadOnlyList<RedmineIssueDto> issues)
        {
            _issues = issues;
        }

        public Task<IReadOnlyList<RedmineIssueDto>> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
            => Task.FromResult(_issues);

        public Task<IReadOnlyList<RedmineTimeEntryDto>> GetTimeEntriesAsync(string? spentOn, int? userId, CancellationToken cancellationToken)
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
