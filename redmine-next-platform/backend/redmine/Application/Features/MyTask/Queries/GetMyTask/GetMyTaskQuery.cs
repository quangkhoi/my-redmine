namespace Redmine.Application.Features.MyTask.Queries.GetMyTask;

public sealed record GetMyTaskQuery(string UserName, string? StartDate = null, string? EndDate = null);
