using Redmine.Application.Features.MyTask.Queries.GetMyTask;
using Riok.Mapperly.Abstractions;

namespace Redmine.Api.Contracts.MyTask;

[Mapper]
public static partial class MyTaskContractMapper
{
    public static partial GetMyTaskResponseContract ToContract(GetMyTaskResponse response);
    public static partial GetMyTaskItemResponseContract ToContract(GetMyTaskItemResponse response);
}
