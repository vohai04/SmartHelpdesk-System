using SmartHelpdesk.Domain.Entities;

namespace SmartHelpdesk.Domain.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user);
    }
}
