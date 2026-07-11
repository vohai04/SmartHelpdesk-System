using MediatR;
using System;

namespace SmartHelpdesk.Application.Features.Categories.Commands.CreateCategory
{
    public class CreateCategoryCommand : IRequest<Guid>
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? AiRoutingKeywords { get; set; }
    }
}
