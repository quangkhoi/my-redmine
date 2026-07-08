namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineUserMapping
{
    public string Login { get; set; } = string.Empty;

    public int Id { get; set; }

    public string? DisplayName { get; set; }
}

