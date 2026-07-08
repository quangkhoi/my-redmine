namespace Redmine.Infrastructure.Redmine;

public interface IRedmineUserDirectory
{
    bool TryResolveUserId(string userName, out int userId);
}

