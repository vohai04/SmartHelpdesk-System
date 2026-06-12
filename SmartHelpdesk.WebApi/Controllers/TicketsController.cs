using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHelpdesk.Application.Features.Tickets.Commands.CreateTicket;
using SmartHelpdesk.Application.Features.Tickets.Queries.GetTickets;
using SmartHelpdesk.Application.Features.Tickets.Queries.GetTicketById;

namespace SmartHelpdesk.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize] // Tạm thời comment lại để test Swagger cho tiện, sẽ mở lại khi làm API Login xong
    public class TicketsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TicketsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTicket([FromBody] CreateTicketCommand command)
        {
            var ticketId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetTicketById), new { id = ticketId }, new { Id = ticketId });
        }

        [HttpGet]
        public async Task<IActionResult> GetTickets([FromQuery] GetTicketsQuery query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTicketById(Guid id)
        {
            var result = await _mediator.Send(new GetTicketByIdQuery(id));
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy Ticket với Id {id}" });
                
            return Ok(result);
        }
    }
}
