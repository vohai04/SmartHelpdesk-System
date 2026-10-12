using System;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartHelpdesk.Application.Features.Attachments.Commands.UploadAttachment;

namespace SmartHelpdesk.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttachmentsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AttachmentsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{id}/content")]
        public async Task<IActionResult> Download(Guid id, [FromServices] SmartHelpdesk.Infrastructure.Persistence.ApplicationDbContext db, [FromServices] Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment)
        {
            var attachment = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleOrDefaultAsync(db.Attachments, a => a.Id == id);
            if (attachment is null) return NotFound();
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role);
            var message = attachment.TicketMessageId.HasValue ? await db.TicketMessages.FindAsync(attachment.TicketMessageId.Value) : null;
            var ticketId = attachment.TicketId ?? message?.TicketId;
            var ticket = ticketId.HasValue ? await db.Tickets.FindAsync(ticketId.Value) : null;
            if (ticket is null || ticket.IsDeleted) return NotFound();
            if (role == "Customer" && (ticket.CreatedById != userId || message?.IsInternalNote == true)) return Forbid();
            if (!attachment.TicketMessageId.HasValue && attachment.UploadedById != userId) return Forbid();
            var folder = System.IO.Path.GetFullPath(System.IO.Path.Combine(environment.WebRootPath, "uploads"));
            var path = System.IO.Path.GetFullPath(System.IO.Path.Combine(folder, System.IO.Path.GetFileName(attachment.FilePath)));
            if (!path.StartsWith(folder + System.IO.Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(path)) return NotFound();
            return PhysicalFile(path, attachment.ContentType, attachment.FileName);
        }

        [HttpPost]
        public async Task<IActionResult> UploadAttachment(
            [FromForm] IFormFile file, 
            [FromForm] Guid? ticketId, 
            [FromForm] Guid? ticketMessageId)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Không tìm thấy file tải lên." });
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out Guid userId))
            {
                return Unauthorized();
            }

            using var stream = file.OpenReadStream();
            
            var command = new UploadAttachmentCommand
            {
                FileStream = stream,
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                TicketId = ticketId,
                TicketMessageId = ticketMessageId,
                UploadedById = userId
            };

            var result = await _mediator.Send(command);

            return Ok(result);
        }
    }
}
