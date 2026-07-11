using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartHelpdesk.Application.Features.Categories.Queries.GetCategories;
using System.Threading.Tasks;

namespace SmartHelpdesk.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CategoriesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _mediator.Send(new GetCategoriesQuery());
            return Ok(categories);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] SmartHelpdesk.Application.Features.Categories.Commands.CreateCategory.CreateCategoryCommand command)
        {
            var categoryId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetCategories), new { id = categoryId }, new { Id = categoryId });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(System.Guid id, [FromBody] SmartHelpdesk.Application.Features.Categories.Commands.UpdateCategory.UpdateCategoryCommand command)
        {
            command.Id = id;
            var result = await _mediator.Send(command);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(System.Guid id)
        {
            var result = await _mediator.Send(new SmartHelpdesk.Application.Features.Categories.Commands.DeleteCategory.DeleteCategoryCommand(id));
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
