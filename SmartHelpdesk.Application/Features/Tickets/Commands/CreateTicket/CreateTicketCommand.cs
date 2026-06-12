using System;
using MediatR;
using SmartHelpdesk.Domain.Enums;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.CreateTicket
{
    public record CreateTicketCommand(
        string Title,
        string Description,
        TicketPriority Priority,
        Guid CategoryId,
        Guid CreatedById
    ) : IRequest<Guid>;
}
