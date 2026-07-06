using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Infrastructure.Redmine;

public sealed class RedmineFacadeTests
{
    [Fact]
    public async Task GetReferenceDataAsync_CachesSuccessfulResponses()
    {
        var handler = new CountingHandler();
        var facade = CreateFacade(handler);

        _ = await facade.GetIssueStatusesAsync(CancellationToken.None);
        _ = await facade.GetIssueStatusesAsync(CancellationToken.None);
        _ = await facade.GetCustomFieldsAsync(CancellationToken.None);
        _ = await facade.GetCustomFieldsAsync(CancellationToken.None);

        Assert.Equal(2, handler.CallCount);
    }

    [Fact]
    public async Task GetCustomFieldsAsync_ReturnsEmptyWhenForbidden()
    {
        var facade = CreateFacade(new ForbiddenHandler());

        var result = await facade.GetCustomFieldsAsync(CancellationToken.None);

        Assert.Empty(result.CustomFields);
    }

    private static RedmineClientFacade CreateFacade(HttpMessageHandler handler)
    {
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123"
        });

        return new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);
    }

    private sealed class CountingHandler : HttpMessageHandler
    {
        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;

            var payload = request.RequestUri!.AbsolutePath.EndsWith("issue_statuses.json", StringComparison.OrdinalIgnoreCase)
                ? """{"issue_statuses":[{"id":1,"name":"Open"}]}"""
                : """{"custom_fields":[{"id":1,"name":"Release Target","possible_values":[{"value":"A","name":"Alpha"}]}]}""";

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json")
            });
        }
    }

    private sealed class ForbiddenHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden));
    }
}
