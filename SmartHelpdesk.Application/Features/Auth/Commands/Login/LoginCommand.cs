using MediatR;
using SmartHelpdesk.Application.Features.Auth.DTOs;

namespace SmartHelpdesk.Application.Features.Auth.Commands.Login
{
    public class LoginCommand : IRequest<AuthResponseDto>
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
