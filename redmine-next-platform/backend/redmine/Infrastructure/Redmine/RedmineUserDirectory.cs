using Microsoft.Extensions.Options;

namespace Redmine.Infrastructure.Redmine;

public sealed class RedmineUserDirectory : IRedmineUserDirectory
{
    private readonly IReadOnlyDictionary<string, int> _userIdsByLogin;

    public RedmineUserDirectory(IOptions<List<RedmineUserMapping>> userMappings)
    {
        _userIdsByLogin = userMappings.Value
            .Where(mapping => !string.IsNullOrWhiteSpace(mapping.Login) && mapping.Id > 0)
            .GroupBy(mapping => mapping.Login.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().Id, StringComparer.OrdinalIgnoreCase);
    }

    public bool TryResolveUserId(string userName, out int userId)
    {
        if (!string.IsNullOrWhiteSpace(userName) && _userIdsByLogin.TryGetValue(userName.Trim(), out userId))
        {
            return true;
        }

        userId = default;
        return false;
    }
}

