namespace Redmine.Domain.MyTask;

public sealed record MyTaskSummary(string UserName, string DisplayName, IReadOnlyList<MyTaskItem> Items);
