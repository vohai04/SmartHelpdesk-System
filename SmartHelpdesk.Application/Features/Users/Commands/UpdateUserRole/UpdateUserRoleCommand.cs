using MediatR;
using SmartHelpdesk.Domain.Enums;
using System;

namespace SmartHelpdesk.Application.Features.Users.Commands.UpdateUserRole
{
    public class UpdateUserRoleCommand : IRequest<bool>
    {
        public Guid UserId { get; set; }
        public UserRole Role { get; set; }
    }
}
