using System;
using MediatR;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.DeleteTicket
{
    public record DeleteTicketCommand(Guid Id) : IRequest<bool>;
}
