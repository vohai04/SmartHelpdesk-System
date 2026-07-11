using System;

namespace SmartHelpdesk.Application.Features.Tickets.DTOs
{
    public record CreateTicketRequestDto(
        string Title,
        string Description,
        Guid CategoryId,
        Guid? RequesterId = null
    );
}
