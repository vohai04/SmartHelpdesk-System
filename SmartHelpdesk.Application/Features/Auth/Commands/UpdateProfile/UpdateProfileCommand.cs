using System;
using MediatR;
using SmartHelpdesk.Application.Features.Auth.DTOs;

namespace SmartHelpdesk.Application.Features.Auth.Commands.UpdateProfile
{
    public class UpdateProfileCommand : IRequest<AuthResponseDto>
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
    }
}
