using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHelpdesk.Application.Features.Users.Commands.RestoreUser;
using SmartHelpdesk.Application.Features.Users.Commands.SoftDeleteUser;
using SmartHelpdesk.Application.Features.Users.Queries.GetUsers;

namespace SmartHelpdesk.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UsersController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Agent")]
        public async Task<IActionResult> GetUsers([FromQuery] GetUsersQuery query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SoftDeleteUser(Guid id)
        {
            await _mediator.Send(new SoftDeleteUserCommand(id));
            return NoContent();
        }

        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RestoreUser(Guid id)
        {
            await _mediator.Send(new RestoreUserCommand(id));
            return NoContent();
        }

        [HttpPut("{id}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] SmartHelpdesk.Application.Features.Users.Commands.UpdateUserRole.UpdateUserRoleCommand command)
        {
            command.UserId = id;
            var result = await _mediator.Send(command);
            if (!result) return BadRequest("Could not update role. Ensure user exists and you are not demoting the last admin.");
            return NoContent();
        }
    }
}
