using MediatR;
using SmartHelpdesk.Application.Features.Categories.DTOs;
using System.Collections.Generic;

namespace SmartHelpdesk.Application.Features.Categories.Queries.GetCategories
{
    public class GetCategoriesQuery : IRequest<IEnumerable<CategoryDto>>
    {
    }
}
