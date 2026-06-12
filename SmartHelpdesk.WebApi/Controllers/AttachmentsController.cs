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
