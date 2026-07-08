namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineApiOptions
{
    public string BaseUrl { get; set; } = string.Empty;

    public string ApiKey { get; set; } = string.Empty;

    public string BasicUser { get; set; } = string.Empty;

    public string BasicPass { get; set; } = string.Empty;
}
