namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineTimeEntryQuery
{
    public int? IssueId { get; init; }

    public int? UserId { get; init; }

    public string? From { get; init; }

    public string? To { get; init; }

    public int? Limit { get; init; }

    public int? Offset { get; init; }
}
