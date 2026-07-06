namespace Redmine.Infrastructure.Redmine;

public sealed record RedmineTimeEntryDto(int Id, string? IssueKey, string? Subject, string? Status, decimal Hours, string? UserName, string? SpentOn);
