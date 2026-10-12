using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHelpdesk.Application.Interfaces;
namespace SmartHelpdesk.WebApi.Controllers;

[ApiController, Authorize, Route("api/notifications")]
public class NotificationsController(INotificationInbox inbox) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken token) => Ok(await inbox.GetAsync(UserId, token));
    public record UpdateNotifications(Guid[] Ids);
    [HttpPost("read")]
    public async Task<IActionResult> Read(UpdateNotifications request, CancellationToken token)
    {
        if (request.Ids is null || request.Ids.Length > 50) return BadRequest();
        await inbox.UpdateAsync(UserId, request.Ids, false, token);
        return NoContent();
    }
    [HttpPost("dismiss")]
    public async Task<IActionResult> Dismiss(UpdateNotifications request, CancellationToken token)
    {
        if (request.Ids is null || request.Ids.Length > 50) return BadRequest();
        await inbox.UpdateAsync(UserId, request.Ids, true, token);
        return NoContent();
    }
}
