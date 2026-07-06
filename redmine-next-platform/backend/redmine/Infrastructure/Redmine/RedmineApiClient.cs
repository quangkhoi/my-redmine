using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineApiClient
{
    private readonly HttpClient _httpClient;
    private readonly RedmineApiOptions _options;
    private readonly ILogger<RedmineApiClient> _logger;

    public RedmineApiClient(HttpClient httpClient, IOptions<RedmineApiOptions> options, ILogger<RedmineApiClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<RedmineIssuesResponse> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
    {
        EnsureConfigured();

        var requestUri = BuildIssuesUri(query);
        _logger.LogInformation("Fetching Redmine issues from {RequestUri}", requestUri);

        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        request.Headers.Add("X-Redmine-API-Key", _options.ApiKey);
        ApplyBasicAuthIfConfigured(request);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Redmine request failed with status {StatusCode}. Body: {Body}", (int)response.StatusCode, body);
            response.EnsureSuccessStatusCode();
        }

        var payload = await response.Content.ReadFromJsonAsync<RedmineIssuesResponse>(cancellationToken: cancellationToken);
        if (payload is null)
        {
            _logger.LogWarning("Redmine response for {RequestUri} was empty or could not be parsed.", requestUri);
        }

        return payload ?? new RedmineIssuesResponse([], 0);
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.BaseUrl))
        {
            throw new InvalidOperationException("Redmine:BaseUrl is required.");
        }

        if (string.IsNullOrWhiteSpace(_options.ApiKey) || _options.ApiKey == "REPLACE_ME")
        {
            throw new InvalidOperationException("Redmine:ApiKey is required.");
        }
    }

    private Uri BuildIssuesUri(RedmineIssueQuery query)
    {
        var baseUri = new Uri(_options.BaseUrl, UriKind.Absolute);
        var builder = new UriBuilder(new Uri(baseUri, "issues.json"));
        var parts = new List<string>();

        if (query.StatusId.HasValue)
        {
            parts.Add($"status_id={query.StatusId.Value}");
        }

        if (query.AssignedToId.HasValue)
        {
            parts.Add($"assigned_to_id={query.AssignedToId.Value}");
        }

        if (!string.IsNullOrWhiteSpace(query.DueDate))
        {
            parts.Add($"due_date={Uri.EscapeDataString(query.DueDate)}");
        }

        if (!string.IsNullOrWhiteSpace(query.UpdatedOn))
        {
            parts.Add($"updated_on={Uri.EscapeDataString(query.UpdatedOn)}");
        }

        if (!string.IsNullOrWhiteSpace(query.SpentOn))
        {
            parts.Add($"spent_on={Uri.EscapeDataString(query.SpentOn)}");
        }

        builder.Query = string.Join('&', parts);
        return builder.Uri;
    }

    private void ApplyBasicAuthIfConfigured(HttpRequestMessage request)
    {
        if (!string.IsNullOrWhiteSpace(_options.BasicUser) && !string.IsNullOrWhiteSpace(_options.BasicPass))
        {
            var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.BasicUser}:{_options.BasicPass}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        }
    }
}

public sealed record RedmineIssuesResponse(IReadOnlyList<RedmineIssueDto> Issues, int TotalCount);

public sealed record RedmineIssueDto(
    int Id,
    string Subject,
    RedmineNameDto? Status,
    RedmineNameDto? AssignedTo,
    decimal? SpentHours,
    string? DueDate);

public sealed record RedmineNameDto(string Name);
