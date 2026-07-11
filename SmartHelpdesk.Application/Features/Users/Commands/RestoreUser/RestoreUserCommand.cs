using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Users.Commands.RestoreUser
{
    public class RestoreUserCommand : IRequest<bool>
    {
        public Guid UserId { get; set; }

        public RestoreUserCommand(Guid userId)
        {
            UserId = userId;
        }
    }
}
