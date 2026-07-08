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

        _ = await client.GetIssuesAsync(new RedmineIssueQuery { StatusId = "1" }, CancellationToken.None);

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
    public async Task GetIssuesAsync_BuildsLegacyRangePagingAndSortFilters()
    {
        var handler = new RecordingHandler();
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123"
        });

        var client = new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);

        _ = await client.GetIssuesAsync(new RedmineIssueQuery
        {
            StatusId = "*",
            AssignedToId = 99,
            StartDate = "><2026-07-01|2026-07-03",
            DueDate = ">=2026-07-01",
            Sort = "start_date:asc,due_date:asc,id:asc",
            Limit = 100,
            Offset = 200
        }, CancellationToken.None);

        Assert.Equal("https://redmine.wdm.co.jp/issues.json", handler.RequestUri!.GetLeftPart(UriPartial.Path));
        var issueQuery = Uri.UnescapeDataString(handler.RequestUri.Query);
        Assert.Contains("status_id=*", issueQuery);
        Assert.Contains("assigned_to_id=99", issueQuery);
        Assert.Contains("start_date=><2026-07-01|2026-07-03", issueQuery);
        Assert.Contains("due_date=>=2026-07-01", issueQuery);
        Assert.Contains("sort=start_date:asc,due_date:asc,id:asc", issueQuery);
        Assert.Contains("limit=100", issueQuery);
        Assert.Contains("offset=200", issueQuery);
    }

    [Fact]
    public async Task GetTimeEntriesAsync_BuildsRangePagingAndUserFilters()
    {
        var handler = new RecordingTimeEntryHandler();
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123"
        });

        var client = new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);

        _ = await client.GetTimeEntriesAsync(new RedmineTimeEntryQuery
        {
            From = "2026-07-01",
            To = "2026-07-31",
            UserId = 99,
            IssueId = 1234,
            Limit = 100,
            Offset = 300
        }, CancellationToken.None);

        Assert.Equal("https://redmine.wdm.co.jp/time_entries.json", handler.RequestUri!.GetLeftPart(UriPartial.Path));
        var timeEntryQuery = Uri.UnescapeDataString(handler.RequestUri.Query);
        Assert.Contains("from=2026-07-01", timeEntryQuery);
        Assert.Contains("to=2026-07-31", timeEntryQuery);
        Assert.Contains("user_id=99", timeEntryQuery);
        Assert.Contains("issue_id=1234", timeEntryQuery);
        Assert.Contains("limit=100", timeEntryQuery);
        Assert.Contains("offset=300", timeEntryQuery);
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

    private sealed class RecordingTimeEntryHandler : HttpMessageHandler
    {
        public Uri? RequestUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"time_entries":[],"total_count":0}""", Encoding.UTF8, "application/json")
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
