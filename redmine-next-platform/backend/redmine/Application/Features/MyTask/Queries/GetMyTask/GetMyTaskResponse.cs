namespace Redmine.Application.Features.MyTask.Queries.GetMyTask;

public sealed record GetMyTaskResponse(string UserName, string DisplayName, IReadOnlyList<GetMyTaskItemResponse> Items);

public sealed record GetMyTaskItemResponse(string IssueKey, string Subject, string Status);
