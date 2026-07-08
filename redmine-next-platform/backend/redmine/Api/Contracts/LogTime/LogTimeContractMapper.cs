using Redmine.Application.Features.LogTime.Queries.GetLogTime;
using Riok.Mapperly.Abstractions;

namespace Redmine.Api.Contracts.LogTime;

[Mapper]
public static partial class LogTimeContractMapper
{
    public static partial GetLogTimeResponseContract ToContract(GetLogTimeResponse response);
    public static partial GetLogTimeItemResponseContract ToContract(GetLogTimeItemResponse response);
}
