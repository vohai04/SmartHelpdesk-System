using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace SmartHelpdesk.Application.Features.Categories.Commands.CreateCategory
{
    public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Guid>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateCategoryCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Guid> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
        {
            var repository = _unitOfWork.Repository<Category>();
            
            var category = new Category
            {
                Name = request.Name,
                Description = request.Description,
                AiRoutingKeywords = request.AiRoutingKeywords
            };

            await repository.AddAsync(category);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return category.Id;
        }
    }
}
