using Redmine.Application.Features.Dashboard.Queries.GetDashboard;

namespace Redmine.Tests.Unit.Features.Dashboard;

public sealed class GetDashboardQueryValidatorTests
{
    [Fact]
    public void Validate_RejectsEmptyUserName()
    {
        var validator = new GetDashboardQueryValidator();

        var result = validator.Validate(new GetDashboardQuery(string.Empty, "2026-07-03"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(GetDashboardQuery.UserName));
    }
}
