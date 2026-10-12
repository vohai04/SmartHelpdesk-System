using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Users.Commands.SoftDeleteUser
{
    public class SoftDeleteUserCommand : IRequest<bool>
    {
        public Guid UserId { get; set; }
        public Guid CurrentUserId { get; set; }

        public SoftDeleteUserCommand(Guid userId, Guid currentUserId)
        {
            UserId = userId;
            CurrentUserId = currentUserId;
        }
    }
}
