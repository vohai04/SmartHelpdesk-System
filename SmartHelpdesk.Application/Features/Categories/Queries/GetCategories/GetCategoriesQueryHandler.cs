using MediatR;
using SmartHelpdesk.Application.Features.Categories.DTOs;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Features.Categories.Queries.GetCategories
{
    public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, IEnumerable<CategoryDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetCategoriesQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
        {
            var repository = _unitOfWork.Repository<Category>();
            var categories = await repository.GetAllAsync();
            
            return categories.Where(c => !c.IsDeleted).Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                AiRoutingKeywords = c.AiRoutingKeywords,
                IsDeleted = c.IsDeleted
            }).ToList();
        }
    }
}
