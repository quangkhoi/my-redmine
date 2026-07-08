using Redmine.Domain.LogTime;

namespace Redmine.Application.Features.LogTime.Services;

public interface ILogTimeReader
{
    Task<LogTimeSummary?> GetForUserAsync(string reportDate, string userName, CancellationToken cancellationToken);
}
