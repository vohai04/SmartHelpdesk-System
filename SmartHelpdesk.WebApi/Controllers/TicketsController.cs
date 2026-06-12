using System;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Features.Messages.Commands.AddMessage;
using SmartHelpdesk.Application.Features.Messages.Queries.GetMessagesByTicketId;
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

        [HttpPost("{ticketId}/messages")]
        public async Task<IActionResult> AddMessage(Guid ticketId, [FromBody] AddMessageCommand command)
        {
            if (ticketId != command.TicketId)
            {
                return BadRequest(new { message = "TicketId in URL must match TicketId in body." });
            }
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("{ticketId}/messages")]
        public async Task<IActionResult> GetMessagesByTicketId(Guid ticketId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
        {
            var query = new GetMessagesByTicketIdQuery { TicketId = ticketId, PageNumber = pageNumber, PageSize = pageSize };
            var result = await _mediator.Send(query);
            return Ok(result);
        }
    }
}
