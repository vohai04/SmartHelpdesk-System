using System;
using System.Threading.Tasks;
using System.Security.Claims;
using MediatR;
using SmartHelpdesk.Application.Features.Messages.Commands.AddMessage;
using SmartHelpdesk.Application.Features.Messages.Queries.GetMessagesByTicketId;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHelpdesk.Application.Features.Tickets.Commands.CreateTicket;
using SmartHelpdesk.Application.Features.Tickets.Queries.GetTickets;
using SmartHelpdesk.Application.Features.Tickets.Queries.GetTicketById;
using SmartHelpdesk.Application.Features.Tickets.Commands.DeleteTicket;
using SmartHelpdesk.Application.Features.Tickets.Queries.AnalyzeTicketSentiment;
using SmartHelpdesk.Application.Features.Tickets.Queries.SuggestTicketReply;
using SmartHelpdesk.Application.Features.Tickets.Commands.UpdateTicket;

namespace SmartHelpdesk.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Yêu cầu đăng nhập
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
            // Tự động lấy UserId từ JWT Token
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                command = command with { CreatedById = userId };
            }

            var ticketId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetTicketById), new { id = ticketId }, new { Id = ticketId });
        }

        [HttpGet]
        public async Task<IActionResult> GetTickets([FromQuery] GetTicketsQuery query)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                query.CurrentUserId = userId;
            }
            query.CurrentUserRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTicketById(Guid id)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(userIdClaim, out Guid userId);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            var result = await _mediator.Send(new GetTicketByIdQuery(id, userId, role));
            if (result == null)
                return NotFound(new { message = $"Không tìm thấy Ticket với Id {id}" });
                
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,SupportAgent")]
        public async Task<IActionResult> UpdateTicket(Guid id, [FromBody] UpdateTicketCommand command)
        {
            command.TicketId = id;
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                command.CurrentUserId = userId;
            }
            command.CurrentUserRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            var result = await _mediator.Send(command);
            return NoContent();
        }

        [HttpPost("{ticketId}/messages")]
        public async Task<IActionResult> AddMessage(Guid ticketId, [FromBody] AddMessageCommand command)
        {
            if (ticketId != command.TicketId)
            {
                return BadRequest(new { message = "TicketId in URL must match TicketId in body." });
            }
            
            // Tự động lấy UserId từ JWT Token
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                command.SenderId = userId;
            }

            // Chặn Customer gửi tin nhắn nội bộ
            var role = User.FindFirstValue(ClaimTypes.Role);
            if (role == SmartHelpdesk.Domain.Enums.UserRole.Customer.ToString())
            {
                command.IsInternalNote = false;
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

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTicket(Guid id)
        {
            var result = await _mediator.Send(new DeleteTicketCommand(id));
            return NoContent();
        }

        [HttpGet("{id}/ai/sentiment")]
        [Authorize(Roles = "Admin,Agent")]
        public async Task<IActionResult> AnalyzeSentiment(Guid id)
        {
            var result = await _mediator.Send(new AnalyzeTicketSentimentQuery(id));
            return Ok(new { sentiment = result });
        }

        [HttpGet("{id}/ai/suggest-reply")]
        [Authorize(Roles = "Admin,Agent")]
        public async Task<IActionResult> SuggestReply(Guid id)
        {
            var result = await _mediator.Send(new SuggestTicketReplyQuery(id));
            return Ok(new { suggestion = result });
        }
    }
}
