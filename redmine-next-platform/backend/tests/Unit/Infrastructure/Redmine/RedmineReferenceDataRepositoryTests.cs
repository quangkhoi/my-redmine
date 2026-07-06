using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Redmine.Infrastructure.Redmine;

namespace Redmine.Tests.Unit.Infrastructure.Redmine;

public sealed class RedmineReferenceDataRepositoryTests
{
    [Fact]
    public async Task GetCustomFieldsAsync_ReturnsEmptyWhenForbidden()
    {
        var client = CreateClient(new ForbiddenHandler());
        var repository = new RedmineReferenceDataRepository(client);

        var result = await repository.GetCustomFieldsAsync(CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetIssueStatusesAsync_ReturnsEmptyWhenForbidden()
    {
        var client = CreateClient(new ForbiddenHandler());
        var repository = new RedmineReferenceDataRepository(client);

        var result = await repository.GetIssueStatusesAsync(CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetCustomFieldsAsync_CachesSuccessfulResponse()
    {
        var handler = new CountingJsonHandler("""{"custom_fields":[{"id":1,"name":"Release Target","possible_values":[{"value":"A","name":"Alpha"}]}]}""");
        var client = CreateClient(handler);
        var repository = new RedmineReferenceDataRepository(client);

        var first = await repository.GetCustomFieldsAsync(CancellationToken.None);
        var second = await repository.GetCustomFieldsAsync(CancellationToken.None);

        Assert.Single(first);
        Assert.Single(second);
        Assert.Equal(1, handler.CallCount);
    }

    private static RedmineClientFacade CreateClient(HttpMessageHandler handler)
    {
        var options = Options.Create(new RedmineApiOptions
        {
            BaseUrl = "https://redmine.wdm.co.jp/",
            ApiKey = "abc123"
        });

        return new RedmineClientFacade(new HttpClient(handler), options, NullLogger<RedmineClientFacade>.Instance);
    }

    private sealed class ForbiddenHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden));
    }

    private sealed class CountingJsonHandler : HttpMessageHandler
    {
        private readonly string _json;

        public CountingJsonHandler(string json)
        {
            _json = json;
        }

        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(_json, Encoding.UTF8, "application/json")
            });
        }
    }
}
