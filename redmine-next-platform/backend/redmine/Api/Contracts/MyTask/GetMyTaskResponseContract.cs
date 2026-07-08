namespace Redmine.Api.Contracts.MyTask;

public sealed record GetMyTaskResponseContract(string UserName, string DisplayName, IReadOnlyList<GetMyTaskItemResponseContract> Items);

public sealed record GetMyTaskItemResponseContract(
    string IssueKey,
    string Subject,
    string Status,
    string? ProjectName,
    string? StartDate,
    string? DueDate,
    int DoneRatio,
    string? TrackerName);
