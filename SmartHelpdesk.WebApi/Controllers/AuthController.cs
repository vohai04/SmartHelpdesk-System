using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using SmartHelpdesk.Application.Features.Auth.Commands.Login;
using SmartHelpdesk.Application.Features.Auth.Commands.Register;
using SmartHelpdesk.Application.Features.Auth.Commands.UpdateProfile;
using SmartHelpdesk.Application.Features.Auth.Commands.ChangePassword;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;

namespace SmartHelpdesk.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                command.UserId = userId;
            }
            else
            {
                return Unauthorized();
            }

            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                command.UserId = userId;
            }
            else
            {
                return Unauthorized();
            }

            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
