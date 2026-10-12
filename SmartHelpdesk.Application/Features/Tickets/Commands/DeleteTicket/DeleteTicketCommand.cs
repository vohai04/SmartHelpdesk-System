using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.DeleteTicket
{
    public record DeleteTicketCommand(Guid Id, Guid CurrentUserId) : IRequest<bool>;
}
