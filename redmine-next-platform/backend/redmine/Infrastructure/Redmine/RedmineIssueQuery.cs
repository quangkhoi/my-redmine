namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineIssueQuery
{
    public string? StatusId { get; init; }

    public int? AssignedToId { get; init; }

    public string? StartDate { get; init; }

    public string? DueDate { get; init; }

    public string? UpdatedOn { get; init; }

    public string? SpentOn { get; init; }

    public string? Sort { get; init; }

    public int? Limit { get; init; }

    public int? Offset { get; init; }
}
