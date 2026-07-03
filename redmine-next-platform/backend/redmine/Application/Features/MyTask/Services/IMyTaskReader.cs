using Redmine.Domain.MyTask;

namespace Redmine.Application.Features.MyTask.Services;

public interface IMyTaskReader
{
    Task<MyTaskSummary?> GetForUserAsync(string userName, CancellationToken cancellationToken);
}
