using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineClientFacade : IRedmineClientFacade
{
    private readonly HttpClient _httpClient;
    private readonly RedmineApiOptions _options;
    private readonly ILogger<RedmineClientFacade> _logger;
    private readonly object _sync = new();
    private Task<IReadOnlyList<RedmineIssueStatusDto>>? _issueStatusesTask;
    private Task<IReadOnlyList<RedmineCustomFieldDto>>? _customFieldsTask;

    public RedmineClientFacade(HttpClient httpClient, IOptions<RedmineApiOptions> options, ILogger<RedmineClientFacade> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public Task<RedmineIssuesResponse> GetIssuesAsync(RedmineIssueQuery query, CancellationToken cancellationToken)
        => SendAsync<RedmineIssuesResponse>(BuildIssuesUri(query), cancellationToken);

    public Task<RedmineTimeEntriesResponse> GetTimeEntriesAsync(string? spentOn, int? userId, CancellationToken cancellationToken)
        => SendAsync<RedmineTimeEntriesResponse>(BuildTimeEntriesUri(spentOn, userId), cancellationToken);

    public async Task<RedmineIssueStatusesResponse> GetIssueStatusesAsync(CancellationToken cancellationToken)
        => new(await GetIssueStatusesCachedAsync(cancellationToken));

    public async Task<RedmineCustomFieldsResponse> GetCustomFieldsAsync(CancellationToken cancellationToken)
        => new(await GetCustomFieldsCachedAsync(cancellationToken));

    private async Task<IReadOnlyList<RedmineIssueStatusDto>> GetIssueStatusesCachedAsync(CancellationToken cancellationToken)
    {
        if (_issueStatusesTask is null)
        {
            lock (_sync)
            {
                _issueStatusesTask ??= LoadIssueStatusesAsync();
            }
        }

        return await _issueStatusesTask;
    }

    private async Task<IReadOnlyList<RedmineCustomFieldDto>> GetCustomFieldsCachedAsync(CancellationToken cancellationToken)
    {
        if (_customFieldsTask is null)
        {
            lock (_sync)
            {
                _customFieldsTask ??= LoadCustomFieldsAsync();
            }
        }

        return await _customFieldsTask;
    }

    private async Task<IReadOnlyList<RedmineIssueStatusDto>> LoadIssueStatusesAsync()
    {
        try
        {
            return (await SendAsync<RedmineIssueStatusesResponse>(new Uri(new Uri(_options.BaseUrl, UriKind.Absolute), "issue_statuses.json"), CancellationToken.None)).IssueStatuses ?? [];
        }
        catch (HttpRequestException)
        {
            return [];
        }
    }

    private async Task<IReadOnlyList<RedmineCustomFieldDto>> LoadCustomFieldsAsync()
    {
        try
        {
            return (await SendAsync<RedmineCustomFieldsResponse>(new Uri(new Uri(_options.BaseUrl, UriKind.Absolute), "custom_fields.json"), CancellationToken.None)).CustomFields ?? [];
        }
        catch (HttpRequestException)
        {
            return [];
        }
    }

    private async Task<TResponse> SendAsync<TResponse>(Uri requestUri, CancellationToken cancellationToken)
    {
        EnsureConfigured();
        _logger.LogInformation("Fetching Redmine data from {RequestUri}", requestUri);

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

        return (await response.Content.ReadFromJsonAsync<TResponse>(cancellationToken: cancellationToken))!;
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

        if (query.StatusId.HasValue) parts.Add($"status_id={query.StatusId.Value}");
        if (query.AssignedToId.HasValue) parts.Add($"assigned_to_id={query.AssignedToId.Value}");
        if (!string.IsNullOrWhiteSpace(query.DueDate)) parts.Add($"due_date={Uri.EscapeDataString(query.DueDate)}");
        if (!string.IsNullOrWhiteSpace(query.UpdatedOn)) parts.Add($"updated_on={Uri.EscapeDataString(query.UpdatedOn)}");
        if (!string.IsNullOrWhiteSpace(query.SpentOn)) parts.Add($"spent_on={Uri.EscapeDataString(query.SpentOn)}");

        builder.Query = string.Join('&', parts);
        return builder.Uri;
    }

    private Uri BuildTimeEntriesUri(string? spentOn, int? userId)
    {
        var baseUri = new Uri(_options.BaseUrl, UriKind.Absolute);
        var builder = new UriBuilder(new Uri(baseUri, "time_entries.json"));
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(spentOn)) parts.Add($"spent_on={Uri.EscapeDataString(spentOn)}");
        if (userId.HasValue) parts.Add($"user_id={userId.Value}");

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

public sealed record RedmineIssuesResponse([property: JsonPropertyName("issues")] IReadOnlyList<RedmineIssueDto> Issues, [property: JsonPropertyName("total_count")] int TotalCount);
public sealed record RedmineTimeEntriesResponse([property: JsonPropertyName("time_entries")] IReadOnlyList<RedmineTimeEntryDto> TimeEntries, [property: JsonPropertyName("total_count")] int TotalCount);
public sealed record RedmineIssueStatusesResponse([property: JsonPropertyName("issue_statuses")] IReadOnlyList<RedmineIssueStatusDto> IssueStatuses);
public sealed record RedmineCustomFieldsResponse([property: JsonPropertyName("custom_fields")] IReadOnlyList<RedmineCustomFieldDto> CustomFields);
public sealed record RedmineIssueDto([property: JsonPropertyName("id")] int Id, [property: JsonPropertyName("subject")] string Subject, [property: JsonPropertyName("project")] RedmineNameDto? Project, [property: JsonPropertyName("tracker")] RedmineNameDto? Tracker, [property: JsonPropertyName("status")] RedmineNameDto? Status, [property: JsonPropertyName("assigned_to")] RedmineNameDto? AssignedTo, [property: JsonPropertyName("start_date")] string? StartDate, [property: JsonPropertyName("done_ratio")] int DoneRatio, [property: JsonPropertyName("spent_hours")] decimal? SpentHours, [property: JsonPropertyName("due_date")] string? DueDate, [property: JsonPropertyName("custom_fields")] IReadOnlyList<RedmineIssueCustomFieldDto>? CustomFields);
public sealed record RedmineNameDto([property: JsonPropertyName("id")] int? Id, [property: JsonPropertyName("name")] string Name);
public sealed record RedmineTimeEntryDto([property: JsonPropertyName("id")] int Id, [property: JsonPropertyName("issue")] RedmineIssueRefDto? Issue, [property: JsonPropertyName("user")] RedmineNameDto? User, [property: JsonPropertyName("hours")] decimal Hours, [property: JsonPropertyName("spent_on")] string? SpentOn, [property: JsonPropertyName("comments")] string? Comments);
public sealed record RedmineIssueRefDto([property: JsonPropertyName("id")] int? Id, [property: JsonPropertyName("subject")] string? Subject);
public sealed record RedmineIssueCustomFieldDto([property: JsonPropertyName("id")] int Id, [property: JsonPropertyName("name")] string Name, [property: JsonPropertyName("value")] JsonElement Value);
public sealed record RedmineIssueStatusDto([property: JsonPropertyName("id")] int Id, [property: JsonPropertyName("name")] string Name);
public sealed record RedmineCustomFieldDto([property: JsonPropertyName("id")] int Id, [property: JsonPropertyName("name")] string Name, [property: JsonPropertyName("possible_values")] IReadOnlyList<RedmineCustomFieldValueDto>? PossibleValues);
public sealed record RedmineCustomFieldValueDto([property: JsonPropertyName("value")] string? Value, [property: JsonPropertyName("name")] string? Name, [property: JsonPropertyName("label")] string? Label);
