using Redmine.Application.Features.MyTask.Queries.GetMyTask;

namespace Redmine.Tests.Unit.Features.MyTask;

public sealed class GetMyTaskQueryValidatorTests
{
    [Fact]
    public void Validate_RejectsEmptyUserName()
    {
        var validator = new GetMyTaskQueryValidator();

        var result = validator.Validate(new GetMyTaskQuery(string.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(GetMyTaskQuery.UserName));
    }
}
