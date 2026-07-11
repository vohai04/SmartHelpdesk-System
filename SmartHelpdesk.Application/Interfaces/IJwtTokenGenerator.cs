using SmartHelpdesk.Domain.Entities;

namespace SmartHelpdesk.Application.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user);
    }
}
