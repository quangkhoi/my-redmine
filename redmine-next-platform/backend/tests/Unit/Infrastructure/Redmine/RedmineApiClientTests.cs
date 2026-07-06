using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Infrastructure.Redmine;

public sealed class RedmineApiClientTests
{
    [Fact]
    public async Task GetIssuesAsync_ThrowsWhenApiKeyIsMissing()
    {
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/"
        });

        var client = new RedmineClientFacade(new HttpClient(new FakeHandler()), options, NullLogger<RedmineClientFacade>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() => client.GetIssuesAsync(new RedmineIssueQuery(), CancellationToken.None));
    }

    [Fact]
    public async Task GetIssuesAsync_SendsApiKeyHeaderAndUsesConfiguredBaseUrl()
    {
        var handler = new RecordingHandler();
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123"
        });

        var client = new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);

        _ = await client.GetIssuesAsync(new RedmineIssueQuery { StatusId = 1 }, CancellationToken.None);

        Assert.Equal("https://redmine.wdm.co.jp/issues.json?status_id=1", handler.RequestUri!.ToString());
        Assert.Equal("abc123", handler.RequestHeaders.GetValues("X-Redmine-API-Key").Single());
    }

    [Fact]
    public async Task GetIssuesAsync_DeserializesIssueStatusObject()
    {
        var handler = new FakeHandlerWithStatusObject();
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123"
        });

        var client = new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);

        var result = await client.GetIssuesAsync(new RedmineIssueQuery(), CancellationToken.None);

        Assert.Single(result.Issues);
        Assert.Equal("In Progress", result.Issues[0].Status?.Name);
    }

    [Fact]
    public async Task GetIssuesAsync_SendsBasicAuthWhenConfigured()
    {
        var handler = new RecordingHandler();
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123",
            BasicUser = "user1",
            BasicPass = "pass1"
        });

        var client = new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);

        _ = await client.GetIssuesAsync(new RedmineIssueQuery { AssignedToId = 99 }, CancellationToken.None);

        Assert.Equal("https://redmine.wdm.co.jp/issues.json?assigned_to_id=99", handler.RequestUri!.ToString());
        Assert.Equal("abc123", handler.RequestHeaders.GetValues("X-Redmine-API-Key").Single());
        Assert.True(handler.RequestHeaders.Authorization is not null);
    }

    [Fact]
    public async Task GetIssueStatusesAsync_RequestsIssueStatusesEndpoint()
    {
        var handler = new RecordingHandler();
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123"
        });

        var client = new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);

        _ = await client.GetIssueStatusesAsync(CancellationToken.None);

        Assert.Equal("https://redmine.wdm.co.jp/issue_statuses.json", handler.RequestUri!.ToString());
    }

    [Fact]
    public async Task GetCustomFieldsAsync_RequestsCustomFieldsEndpoint()
    {
        var handler = new RecordingHandler();
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123"
        });

        var client = new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);

        _ = await client.GetCustomFieldsAsync(CancellationToken.None);

        Assert.Equal("https://redmine.wdm.co.jp/custom_fields.json", handler.RequestUri!.ToString());
    }

    private sealed class FakeHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"issues":[],"total_count":0}""", Encoding.UTF8, "application/json")
            });
    }

    private sealed class RecordingHandler : HttpMessageHandler
    {
        public Uri? RequestUri { get; private set; }
        public HttpRequestHeaders? RequestHeaders { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            RequestHeaders = request.Headers;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"issues":[],"total_count":0}""", Encoding.UTF8, "application/json")
            });
        }
    }

    private sealed class FakeHandlerWithStatusObject : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"issues":[{"id":1,"subject":"Task","status":{"id":2,"name":"In Progress"},"assigned_to":{"id":7,"name":"Tuyen Nguyen"},"spent_hours":1.5,"due_date":"2026-07-03"}],"total_count":1}""", Encoding.UTF8, "application/json")
            });
    }
}
