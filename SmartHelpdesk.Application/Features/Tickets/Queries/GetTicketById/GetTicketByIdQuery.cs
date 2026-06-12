using System;
using MediatR;
using SmartHelpdesk.Application.Features.Tickets.DTOs;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.GetTicketById
{
    public record GetTicketByIdQuery(Guid Id, Guid CurrentUserId, string CurrentUserRole) : IRequest<TicketDto?>;
}
