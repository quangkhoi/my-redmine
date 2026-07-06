using System.Net;
using System.Text.Json;

namespace Redmine.Tests.Integration;

public sealed class EndpointSmokeTests : IClassFixture<RedmineApiFactory>
{
    private readonly HttpClient _client;

    public EndpointSmokeTests(RedmineApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DashboardEndpoint_ReturnsOkAndPayload()
    {
        var response = await _client.GetAsync("/api/dashboard/2026-07-03/tuyennguyen");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("tuyennguyen", payload.RootElement.GetProperty("userName").GetString());
    }

    [Fact]
    public async Task DashboardEndpoint_AllowsLocalFrontendOrigin()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/dashboard/2026-07-03/tuyennguyen");
        request.Headers.TryAddWithoutValidation("Origin", "http://localhost:3001");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var values));
        Assert.Contains("http://localhost:3001", values);
    }

    [Fact]
    public async Task MyTaskEndpoint_ReturnsOkAndPayload()
    {
        var response = await _client.GetAsync("/api/my-task/tuyennguyen");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("tuyennguyen", payload.RootElement.GetProperty("userName").GetString());
    }

    [Fact]
    public async Task DailyReportEndpoint_ReturnsOkAndPayload()
    {
        var response = await _client.GetAsync("/api/daily-report/2026-07-03/tuyennguyen");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task WeeklyReportEndpoint_ReturnsOkAndPayload()
    {
        var response = await _client.GetAsync("/api/weekly-report/2026-07-01/tuyennguyen");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task LogTimeEndpoint_ReturnsOkAndPayload()
    {
        var response = await _client.GetAsync("/api/log-time/2026-07-03/tuyennguyen");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
