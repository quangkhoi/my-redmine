namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineIssueQuery
{
    public int? StatusId { get; init; }

    public int? AssignedToId { get; init; }

    public string? DueDate { get; init; }

    public string? UpdatedOn { get; init; }

    public string? SpentOn { get; init; }
}
