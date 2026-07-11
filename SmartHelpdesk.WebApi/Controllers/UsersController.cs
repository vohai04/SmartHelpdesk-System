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
    [Authorize(Roles = "Admin")] // Only Admins can manage users
    public class UsersController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UsersController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] GetUsersQuery query)
        {
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteUser(Guid id)
        {
            await _mediator.Send(new SoftDeleteUserCommand(id));
            return NoContent();
        }

        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreUser(Guid id)
        {
            await _mediator.Send(new RestoreUserCommand(id));
            return NoContent();
        }
    }
}
